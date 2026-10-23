import React, { useState, useMemo } from 'react';
import { GameMarket } from '../types/sportsBetting';
import { playKeyClick, playSuccessChime } from '../utils/audio';
import { GameStatusBadge, getGameDisplayStatus } from './common/GameStatusBadge';
import { getCleanTeamName, reassignSlateRanks } from '../data/nflMarketOpinionsData';
import { formatToLocalUserTime } from '../utils/timeZoneUtils';

interface SlateConfidenceRankingsViewProps {
  games: GameMarket[];
  onSelectGame: (gameId: string) => void;
  onOpenLiveShifts: () => void;
}

export const SlateConfidenceRankingsView: React.FC<SlateConfidenceRankingsViewProps> = ({
  games: rawGames,
  onSelectGame,
  onOpenLiveShifts,
}) => {
  const games = useMemo(() => reassignSlateRanks(rawGames), [rawGames]);
  const [filterType, setFilterType] = useState<'ALL' | 'TOP_5' | 'SPREADS' | 'MONEYLINE' | 'TOTALS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  // Sort upcoming to-be-played games strictly by model confidence and re-index sequentially 1..N
  const rankedGames = useMemo(() => {
    // 1. Exclude completed/FINAL games so this view strictly represents TO-BE-PLAYED games
    const list = games.filter((g) => !getGameDisplayStatus(g).isCompleted && g.marketOpinions);

    list.sort((a, b) => {
      const rankA = a.marketOpinions?.overallConfidenceRank ?? 999;
      const rankB = b.marketOpinions?.overallConfidenceRank ?? 999;
      return rankA - rankB;
    });

    const filtered = list.filter((g) => {
      if (filterType === 'TOP_5' && (g.marketOpinions?.overallConfidenceRank ?? 99) > 5) return false;
      if (filterType === 'SPREADS' && g.marketOpinions?.spreadOpinion.verdict !== 'STRONG_BUY' && g.marketOpinions?.spreadOpinion.verdict !== 'BUY') return false;
      if (filterType === 'MONEYLINE' && g.marketOpinions?.moneylineOpinion.verdict !== 'STRONG_BUY' && g.marketOpinions?.moneylineOpinion.verdict !== 'BUY') return false;
      if (filterType === 'TOTALS' && g.marketOpinions?.totalOpinion.verdict !== 'STRONG_BUY' && g.marketOpinions?.totalOpinion.verdict !== 'BUY') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTeams = `${g.awayTeam.city} ${g.awayTeam.name} ${g.homeTeam.city} ${g.homeTeam.name}`.toLowerCase();
        return matchTeams.includes(q);
      }
      return true;
    });

    // 2. Assign dynamic contiguous displayRank so no rank numbers are skipped
    return filtered.map((g, idx) => ({
      ...g,
      displayRank: idx + 1,
    }));
  }, [games, filterType, searchQuery]);

  const maxLockCount = useMemo(() => {
    return games.filter((g) => g.marketOpinions?.confidenceTier === 'MAX_LOCK').length;
  }, [games]);

  const strongBuyCount = useMemo(() => {
    let count = 0;
    games.forEach((g) => {
      if (g.marketOpinions?.spreadOpinion.verdict === 'STRONG_BUY') count++;
      if (g.marketOpinions?.moneylineOpinion.verdict === 'STRONG_BUY') count++;
      if (g.marketOpinions?.totalOpinion.verdict === 'STRONG_BUY') count++;
    });
    return count;
  }, [games]);

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold text-xs">
                🎯 3-WAY MARKET OPINIONS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Ranked Most to Least Confident (#1 &rarr; #{rankedGames.length})</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              NFL Slate Confidence Hierarchy &amp; 3-Way Opinions
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl font-sans leading-relaxed">
              Every matchup provides an individualized expert assessment across all three primary wagering vectors: 
              <strong className="text-white"> Point Spread</strong>, 
              <strong className="text-white"> Moneyline (ML)</strong>, and 
              <strong className="text-white"> Over/Under Total</strong>. Games are ranked in strict hierarchy based on 
              composite model conviction, weather severity factors, injury mismatches, and sharp-to-public handle divergence.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                playSuccessChime();
                onOpenLiveShifts();
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-cyan-500/20"
            >
              <span>📊</span>
              <span>Track Live Volume Shifts (Units &amp; $)</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Total Ranked Slate</span>
            <div className="text-lg font-bold text-white">{rankedGames.length} Verified Matchups</div>
            <span className="text-[10px] text-slate-400">Strict #1 to #{rankedGames.length} Order</span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-0.5">
            <span className="text-cyan-400 text-[10px] uppercase font-bold">Max Conviction Locks</span>
            <div className="text-lg font-bold text-cyan-300">{maxLockCount} Matchups (94%+)</div>
            <span className="text-[10px] text-cyan-400/80">#1 Ravens &bull; #2 Panthers</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-0.5">
            <span className="text-emerald-400 text-[10px] uppercase font-bold">Strong Buy Positions</span>
            <div className="text-lg font-bold text-emerald-300">{strongBuyCount} High-Edge Legs</div>
            <span className="text-[10px] text-emerald-400/80">Model EV &gt; +7.0%</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-0.5">
            <span className="text-purple-400 text-[10px] uppercase font-bold">Weather-Altered Totals</span>
            <div className="text-lg font-bold text-purple-300">4 Weather Plays</div>
            <span className="text-[10px] text-purple-400/80">Wind &amp; Dome Extreme Splits</span>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 uppercase text-[11px] font-bold mr-1">Filter:</span>
            <button
              onClick={() => {
                playKeyClick();
                setFilterType('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filterType === 'ALL' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              All Ranked ({rankedGames.length})
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setFilterType('TOP_5');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filterType === 'TOP_5' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Top 5 Highest Conviction
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setFilterType('SPREADS');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filterType === 'SPREADS' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Spread Buys
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setFilterType('MONEYLINE');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filterType === 'MONEYLINE' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Moneyline Values
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setFilterType('TOTALS');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filterType === 'TOTALS' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Over / Under Plays
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or game..."
              className="w-full px-3 py-1.5 pl-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Ranked Games List (Rank #1 to #10) */}
      <div className="space-y-4">
        {rankedGames.map((game) => {
          const ops = game.marketOpinions;
          if (!ops) return null;

          const isExpanded = expandedGameId === game.id;
          const rankNum = (game as any).displayRank || ops.overallConfidenceRank;

          return (
            <div
              key={game.id}
              className={`rounded-2xl border transition-all ${
                rankNum === 1
                  ? 'bg-slate-900/95 border-cyan-500 shadow-xl shadow-cyan-950/30'
                  : rankNum === 2
                  ? 'bg-slate-900/95 border-emerald-500/80 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header & Confidence Badge */}
              <div className="p-5 border-b border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Rank Badge */}
                    <span
                      className={`px-3 py-1 rounded-xl font-black text-xs flex items-center gap-1.5 ${
                        rankNum === 1
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : rankNum === 2
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : rankNum <= 4
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{rankNum === 1 ? '🏆' : rankNum <= 3 ? '★' : '#'}</span>
                      <span>RANK #{rankNum}: {ops.overallConfidenceScore}% CONFIDENCE</span>
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ops.confidenceTier === 'MAX_LOCK'
                          ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
                          : ops.confidenceTier === 'HIGH_CONVICTION'
                          ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                          : ops.confidenceTier === 'STRONG_VALUE'
                          ? 'bg-blue-950 border border-blue-700 text-blue-300'
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}
                    >
                      {ops.confidenceTier.replace(/_/g, ' ')}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      Primary Angle: <strong className="text-white">{ops.primaryRecommendedBet}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <GameStatusBadge game={game} size="xs" showIcon />
                    <span className="text-slate-400">{formatToLocalUserTime(game.scheduledTime)}</span>
                  </div>
                </div>

                {/* Matchup Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                  <div>
                    <h3 className="text-xl font-bold text-white font-sans flex items-center gap-2">
                      <span>{getCleanTeamName(game.awayTeam.city, game.awayTeam.name)} ({game.awayTeam.record})</span>
                      <span className="text-slate-500 font-normal">at</span>
                      <span>{getCleanTeamName(game.homeTeam.city, game.homeTeam.name)} ({game.homeTeam.record})</span>
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-3 pt-0.5 flex-wrap">
                      <span>🏟️ {game.stadium}</span>
                      <span>&bull;</span>
                      <span className={game.weatherForecast?.impactLevel === 'HIGH' ? 'text-amber-400 font-bold' : ''}>
                        {game.weatherForecast?.isDome ? '🏟️ Climate Dome' : `🌦️ ${game.weatherForecast?.temperature || '54°F'}, ${game.weatherForecast?.wind || 'Calm'}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={() => onSelectGame(game.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-cyan-500 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      Inspect Full Game &rarr;
                    </button>
                    <button
                      onClick={() => {
                        playKeyClick();
                        setExpandedGameId(isExpanded ? null : game.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      {isExpanded ? 'Collapse ▲' : 'Why We Picked It ▼'}
                    </button>
                  </div>
                </div>

                {/* Executive Thesis / Why Ranked Here */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed">
                  <span className="font-bold text-cyan-400 font-mono block mb-0.5 text-[11px] uppercase">
                    Model Executive Thesis (Why Ranked #{rankNum}):
                  </span>
                  {ops.executiveMatchupVerdict}
                </div>
              </div>

              {/* 3-WAY OPINION MATRIX (SPREAD, MONEYLINE, OVER/UNDER) */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* BOX 1: SPREAD OPINION */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      ops.spreadOpinion.verdict === 'STRONG_BUY'
                        ? 'bg-slate-950 border-cyan-500/80 shadow-md'
                        : ops.spreadOpinion.verdict === 'BUY'
                        ? 'bg-slate-950 border-emerald-600/70'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          1. SPREAD OPINION
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            ops.spreadOpinion.verdict === 'STRONG_BUY'
                              ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                              : ops.spreadOpinion.verdict === 'BUY'
                              ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                              : 'bg-slate-900 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {ops.spreadOpinion.verdict.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div>
                        <div className="text-base font-black text-white font-sans">{ops.spreadOpinion.pick}</div>
                        <div className="text-xs text-emerald-400 font-bold flex items-center justify-between pt-0.5">
                          <span>Best: {ops.spreadOpinion.odds} ({ops.spreadOpinion.bestSportsbook})</span>
                          <span>+{ops.spreadOpinion.modelEdge}% EV Edge</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 font-sans italic border-t border-slate-800/80 pt-1.5">
                        &ldquo;{ops.spreadOpinion.selectionSummary}&rdquo;
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        Why We Picked This Spread:
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {ops.spreadOpinion.rationale}
                      </p>
                    </div>
                  </div>

                  {/* BOX 2: MONEYLINE (ML) OPINION */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      ops.moneylineOpinion.verdict === 'STRONG_BUY'
                        ? 'bg-slate-950 border-cyan-500/80 shadow-md'
                        : ops.moneylineOpinion.verdict === 'BUY'
                        ? 'bg-slate-950 border-emerald-600/70'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          2. MONEYLINE (ML) OPINION
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            ops.moneylineOpinion.verdict === 'STRONG_BUY'
                              ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                              : ops.moneylineOpinion.verdict === 'BUY'
                              ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                              : 'bg-slate-900 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {ops.moneylineOpinion.verdict.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div>
                        <div className="text-base font-black text-white font-sans">{ops.moneylineOpinion.pick}</div>
                        <div className="text-xs text-emerald-400 font-bold flex items-center justify-between pt-0.5">
                          <span>Best: {ops.moneylineOpinion.odds} ({ops.moneylineOpinion.bestSportsbook})</span>
                          <span>+{ops.moneylineOpinion.modelEdge}% EV Edge</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 font-sans italic border-t border-slate-800/80 pt-1.5">
                        &ldquo;{ops.moneylineOpinion.selectionSummary}&rdquo;
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        Why We Picked This Moneyline:
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {ops.moneylineOpinion.rationale}
                      </p>
                    </div>
                  </div>

                  {/* BOX 3: OVER / UNDER BET OPINION */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      ops.totalOpinion.verdict === 'STRONG_BUY'
                        ? 'bg-slate-950 border-cyan-500/80 shadow-md'
                        : ops.totalOpinion.verdict === 'BUY'
                        ? 'bg-slate-950 border-emerald-600/70'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          3. OVER / UNDER TOTAL OPINION
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            ops.totalOpinion.verdict === 'STRONG_BUY'
                              ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                              : ops.totalOpinion.verdict === 'BUY'
                              ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                              : 'bg-slate-900 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {ops.totalOpinion.verdict.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div>
                        <div className="text-base font-black text-white font-sans">{ops.totalOpinion.pick}</div>
                        <div className="text-xs text-emerald-400 font-bold flex items-center justify-between pt-0.5">
                          <span>Best: {ops.totalOpinion.odds} ({ops.totalOpinion.bestSportsbook})</span>
                          <span>+{ops.totalOpinion.modelEdge}% EV Edge</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 font-sans italic border-t border-slate-800/80 pt-1.5">
                        &ldquo;{ops.totalOpinion.selectionSummary}&rdquo;
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        Why We Picked This Total:
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {ops.totalOpinion.rationale}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Drivers Pill Ribbon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-0.5">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">🌦️ Weather Factor:</span>
                    <span className="text-slate-300 font-sans">{ops.keyFactors.weatherImpactFactor}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-0.5">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">🏥 Injury Edge:</span>
                    <span className="text-slate-300 font-sans">{ops.keyFactors.injuryAdvantage}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-0.5">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">🐋 Sharp Handle:</span>
                    <span className="text-slate-300 font-sans">{ops.keyFactors.sharpMoneySignal}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-0.5">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">⚔️ Scheme Matchup:</span>
                    <span className="text-slate-300 font-sans">{ops.keyFactors.schemeEdge}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
