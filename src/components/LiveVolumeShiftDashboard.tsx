import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameMarket, VolumeTickPulse } from '../types/sportsBetting';
import { playKeyClick, playSuccessChime, playChime } from '../utils/audio';
import { GameStatusBadge, getGameDisplayStatus } from './common/GameStatusBadge';
import { getCleanTeamName } from '../data/nflMarketOpinionsData';
import { formatToLocalUserTime } from '../utils/timeZoneUtils';

interface LiveVolumeShiftDashboardProps {
  games: GameMarket[];
  onSelectGame: (gameId: string) => void;
  onOpenRankings: () => void;
}

export const LiveVolumeShiftDashboard: React.FC<LiveVolumeShiftDashboardProps> = ({
  games,
  onSelectGame,
  onOpenRankings,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'5M' | '15M' | '1H'>('15M');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [tickSpeedSeconds, setTickSpeedSeconds] = useState<number>(5);
  const [lastTickTime, setLastTickTime] = useState<string>(new Date().toLocaleTimeString());
  const [livePulses, setLivePulses] = useState<VolumeTickPulse[]>([]);
  const [volumeDeltas, setVolumeDeltas] = useState<Record<string, { units: number; dollars: number }>>({});
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(true);
  const [showSettledArchive, setShowSettledArchive] = useState<boolean>(false);

  // Active upcoming games only (strictly excluding completed games like TNF & Bills)
  const activeUpcomingGames = useMemo(() => {
    return games.filter((g) => !getGameDisplayStatus(g).isCompleted);
  }, [games]);

  const settledGames = useMemo(() => {
    return games.filter((g) => getGameDisplayStatus(g).isCompleted);
  }, [games]);

  const displayedGames = showSettledArchive ? games : activeUpcomingGames;

  // Initialize pulses from upcoming active game data only
  useEffect(() => {
    const initialPulses: VolumeTickPulse[] = [];
    activeUpcomingGames.forEach((g) => {
      if (g.liveVolumeShifts?.recentPulses) {
        initialPulses.push(...g.liveVolumeShifts.recentPulses);
      }
    });
    setLivePulses(initialPulses.slice(0, 10));
  }, [activeUpcomingGames]);

  // Live Tick Simulation: incrementally shifts betting volume (Units & Dollars) strictly for TO-BE-PLAYED games
  const handleLiveTick = useCallback(() => {
    if (!activeUpcomingGames.length) return;

    // Pick random upcoming game to simulate active bettor volume shift
    const randomGame = activeUpcomingGames[Math.floor(Math.random() * activeUpcomingGames.length)];
    const isWhale = Math.random() > 0.65;
    const isUnderOrOver = Math.random() > 0.5;

    const unitInc = Math.floor(Math.random() * 80) + (isWhale ? 150 : 25);
    const dollarInc = Math.floor(Math.random() * 35000) + (isWhale ? 75000 : 8000);

    const books = ['Circa Sports', 'DraftKings', 'FanDuel', 'Pinnacle', 'Caesars'];
    const chosenBook = books[Math.floor(Math.random() * books.length)];

    const targetSide = isUnderOrOver
      ? (randomGame.consensus.total > 42 ? `Under ${randomGame.consensus.total}` : `Over ${randomGame.consensus.total}`)
      : (randomGame.consensus.spread.includes('-') ? randomGame.consensus.spread : `${randomGame.awayTeam.abbr} Spread`);

    const newPulse: VolumeTickPulse = {
      id: `tick-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      gameId: randomGame.id,
      matchup: `${randomGame.awayTeam.abbr} @ ${randomGame.homeTeam.abbr}`,
      targetSelection: targetSide,
      marketType: isUnderOrOver ? 'TOTAL' : 'SPREAD',
      unitDelta: unitInc,
      dollarDelta: dollarInc,
      sportsbook: chosenBook,
      tag: isWhale ? 'WHALE_LIMIT' : 'STEAM_SURGE',
      summary: `${isWhale ? '🐋 High-Limit Whale' : '⚡ Public Steam'} order placed on ${targetSide} at ${chosenBook}`,
    };

    setLivePulses((prev) => [newPulse, ...prev.slice(0, 19)]);
    setLastTickTime(new Date().toLocaleTimeString());

    setVolumeDeltas((prev) => {
      const existing = prev[randomGame.id] || { units: 0, dollars: 0 };
      return {
        ...prev,
        [randomGame.id]: {
          units: existing.units + unitInc,
          dollars: existing.dollars + dollarInc,
        },
      };
    });

    if (isWhale && audioAlertsEnabled) {
      playChime();
    }
  }, [activeUpcomingGames, audioAlertsEnabled]);

  // Periodic live ticks
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      handleLiveTick();
    }, tickSpeedSeconds * 1000);

    return () => clearInterval(interval);
  }, [isLiveStreaming, tickSpeedSeconds, handleLiveTick]);

  // Aggregate totals (Upcoming games only)
  const totalSlateUnits = useMemo(() => {
    return activeUpcomingGames.reduce((acc, g) => acc + g.totalBetsPlaced + (volumeDeltas[g.id]?.units || 0), 0);
  }, [activeUpcomingGames, volumeDeltas]);

  const totalSlateDollars = useMemo(() => {
    return activeUpcomingGames.reduce((acc, g) => acc + g.totalDollarsWagered + (volumeDeltas[g.id]?.dollars || 0), 0);
  }, [activeUpcomingGames, volumeDeltas]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Top Telemetry Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                LIVE STREAMING VOLUME ENGINE &bull; ACTIVE SHIFTS
              </span>
              <span className="text-xs text-slate-400">
                Last shift tick: <strong className="text-white">{lastTickTime}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Pre-Game Betting Volume Shifts (Units &amp; Dollars)
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl font-sans leading-relaxed">
              Real-time monitoring of ongoing betting volume shifts across major oddsmakers. Track active swings in both 
              <strong className="text-cyan-400"> Units (Bet Tickets Count)</strong> and 
              <strong className="text-emerald-400"> Dollars (Handle Volume)</strong> to detect whether syndicate steam 
              or recreational swarms are pushing market numbers before kickoff.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                playKeyClick();
                setIsLiveStreaming(!isLiveStreaming);
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isLiveStreaming
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isLiveStreaming ? 'Live Shifts Active' : 'Feed Paused'}</span>
            </button>

            <button
              onClick={() => {
                playSuccessChime();
                handleLiveTick();
              }}
              className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow"
            >
              <span>⚡</span>
              <span>Trigger Manual Shift</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                onOpenRankings();
              }}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-all"
            >
              <span>🎯</span>
              <span>View Ranked Opinions &rarr;</span>
            </button>
          </div>
        </div>

        {/* Live Aggregated Volume Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Total Wagers (Units)</span>
            <div className="text-xl font-black text-cyan-300">
              {totalSlateUnits.toLocaleString()} tickets
            </div>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span>▲</span>
              <span>+{(Object.values(volumeDeltas).reduce((a, b) => a + b.units, 0)).toLocaleString()} in session</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Total Handle (Dollars)</span>
            <div className="text-xl font-black text-emerald-300">
              {formatCurrency(totalSlateDollars)}
            </div>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span>▲</span>
              <span>+{formatCurrency(Object.values(volumeDeltas).reduce((a, b) => a + b.dollars, 0))} in session</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Shift Velocity Rate</span>
            <div className="text-xl font-black text-purple-300">
              ~260 units / min
            </div>
            <span className="text-[10px] text-purple-400">
              +$58,000 / min Handle Inflow
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Active Steam Trajectory</span>
            <div className="text-xl font-black text-amber-300">
              Heavy Away Steam
            </div>
            <span className="text-[10px] text-amber-400/90 truncate">
              Baltimore -3.5 (Huntley) &bull; Detroit -3.0
            </span>
          </div>
        </div>

        {/* Controls: Timeframe & Tick Speed */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[11px] font-bold">Volume Window:</span>
            {(['5M', '15M', '1H'] as const).map((win) => (
              <button
                key={win}
                onClick={() => {
                  playKeyClick();
                  setSelectedTimeframe(win);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  selectedTimeframe === win
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {win === '5M' ? 'Last 5 Minutes' : win === '15M' ? 'Last 15 Minutes' : 'Last 1 Hour'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Tick Speed:</span>
              {[3, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    playKeyClick();
                    setTickSpeedSeconds(s);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    tickSpeedSeconds === s ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>

            <button
              onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>{audioAlertsEnabled ? '🔔 Whale Audio On' : '🔕 Audio Muted'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Game Shift Cards & Live Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Matchup Swing Radar Cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>⚡</span>
              <span>Active Volume Swings By Matchup ({selectedTimeframe} Window)</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                {activeUpcomingGames.length} To-Be-Played Games
              </span>
            </h3>
            {settledGames.length > 0 && (
              <button
                onClick={() => {
                  playKeyClick();
                  setShowSettledArchive(!showSettledArchive);
                }}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
              >
                <span>📜</span>
                <span>{showSettledArchive ? 'Hide Completed Games Archive' : `Show Archived Final Games (${settledGames.length})`}</span>
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {displayedGames.map((game) => {
              const shifts = game.liveVolumeShifts;
              const sessionDelta = volumeDeltas[game.id] || { units: 0, dollars: 0 };

              // Determine current shift window data
              const winData = shifts
                ? selectedTimeframe === '5M'
                  ? shifts.windows.fiveMin
                  : selectedTimeframe === '15M'
                  ? shifts.windows.fifteenMin
                  : shifts.windows.oneHour
                : null;

              // Calculate swing percentages
              const totalWinUnits = (winData?.unitsHome || 500) + (winData?.unitsAway || 1500) + sessionDelta.units;
              const totalWinDollars = (winData?.dollarsHome || 100000) + (winData?.dollarsAway || 500000) + sessionDelta.dollars;

              const homeUnitPct = Math.round(((winData?.unitsHome || 500) / totalWinUnits) * 100);
              const awayUnitPct = 100 - homeUnitPct;

              const homeDollarPct = Math.round(((winData?.dollarsHome || 100000) / totalWinDollars) * 100);
              const awayDollarPct = 100 - homeDollarPct;

              const isSwingingAway = awayDollarPct > homeDollarPct + 15;
              const isSwingingHome = homeDollarPct > awayDollarPct + 15;

              return (
                <div
                  key={game.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5"
                >
                  {/* Top Matchup Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap pb-1">
                        <GameStatusBadge game={game} size="xs" showIcon />
                        <span className="text-[10px] text-cyan-400 font-bold uppercase">
                          {formatToLocalUserTime(game.scheduledTime)} &bull; {game.stadium.split(',')[0]}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white font-sans flex items-center gap-2">
                        <span>{getCleanTeamName(game.awayTeam.city, game.awayTeam.name)}</span>
                        <span className="text-slate-500 font-normal">@</span>
                        <span>{getCleanTeamName(game.homeTeam.city, game.homeTeam.name)}</span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Consensus Spread</span>
                        <span className="text-emerald-400 font-black">{game.consensus.spread}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Total O/U</span>
                        <span className="text-cyan-400 font-black">{game.consensus.total}</span>
                      </div>
                      <button
                        onClick={() => onSelectGame(game.id)}
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-cyan-500 text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-colors"
                      >
                        Inspect &rarr;
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE SWING DIRECTION VERDICT CALLOUT */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSwingingAway
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200'
                        : isSwingingHome
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span>{isSwingingAway ? '⚡ SWINGING TO ROAD TEAM:' : isSwingingHome ? '⚡ SWINGING TO HOME TEAM:' : '⚖️ BALANCED VOLUME:'}</span>
                      <span className="text-white">
                        {winData?.dominantSide || (isSwingingAway ? `${game.awayTeam.name} Spread` : 'Evenly Distributed')}
                      </span>
                    </div>

                    <div className="text-[11px] font-sans">
                      {winData?.swingSummary || 'Continuous steady pre-game ticket inflow across legal retail books.'}
                    </div>
                  </div>

                  {/* TWO DUAL VISUAL SWING GAUGES: UNITS VS. DOLLARS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Gauge 1: Units (Bet Ticket Count Shift) */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                          <span>🎟️</span>
                          <span>Units Shift (Tickets)</span>
                        </span>
                        <span className="text-cyan-400 font-bold">
                          +{winData?.unitsAway || 1420} vs. +{winData?.unitsHome || 650}
                        </span>
                      </div>

                      {/* Visual Bar */}
                      <div className="space-y-1">
                        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            className="bg-indigo-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] text-white font-bold"
                            style={{ width: `${awayUnitPct}%` }}
                          >
                            {awayUnitPct > 20 && `${awayUnitPct}%`}
                          </div>
                          <div
                            className="bg-cyan-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] text-slate-950 font-bold"
                            style={{ width: `${homeUnitPct}%` }}
                          >
                            {homeUnitPct > 20 && `${homeUnitPct}%`}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{game.awayTeam.abbr}: {awayUnitPct}%</span>
                          <span>{game.homeTeam.abbr}: {homeUnitPct}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Gauge 2: Dollars (Handle Amount Shift) */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                          <span>💰</span>
                          <span>Dollars Shift (Handle)</span>
                        </span>
                        <span className="text-emerald-400 font-bold">
                          +{formatCurrency(winData?.dollarsAway || 620000)} vs. +{formatCurrency(winData?.dollarsHome || 140000)}
                        </span>
                      </div>

                      {/* Visual Bar */}
                      <div className="space-y-1">
                        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] text-slate-950 font-bold"
                            style={{ width: `${awayDollarPct}%` }}
                          >
                            {awayDollarPct > 20 && `${awayDollarPct}%`}
                          </div>
                          <div
                            className="bg-purple-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] text-white font-bold"
                            style={{ width: `${homeDollarPct}%` }}
                          >
                            {homeDollarPct > 20 && `${homeDollarPct}%`}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{game.awayTeam.abbr}: {awayDollarPct}% ($)</span>
                          <span>{game.homeTeam.abbr}: {homeDollarPct}% ($)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Over / Under Volume Swing Status */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Total O/U Volume:</span>
                      <span className="text-white font-bold">
                        {winData?.unitsUnder && winData.unitsUnder > (winData.unitsOver || 0)
                          ? `Under ${game.consensus.total} taking ${Math.round((winData.dollarsUnder / (winData.dollarsUnder + winData.dollarsOver)) * 100)}% of Handle`
                          : `Over ${game.consensus.total} taking ${Math.round(((winData?.dollarsOver || 50000) / ((winData?.dollarsUnder || 50000) + (winData?.dollarsOver || 50000))) * 100)}% of Handle`}
                      </span>
                    </div>

                    <span className="text-cyan-400">
                      {game.weatherForecast?.isDome ? '🏟️ Fast Dome Track' : `🌦️ ${game.weatherForecast?.conditions || 'Standard Weather'}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Ticker / Real-time Whale Pulse Stream (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Inflow Pulse Feed</span>
            </h3>
            <span className="text-[10px] text-slate-500">Auto-streaming</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="text-xs text-slate-400 font-sans leading-relaxed border-b border-slate-800 pb-2">
              Real-time incoming bet pulses from DraftKings, FanDuel, and Circa Sports benchmark limits:
            </div>

            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {livePulses.map((pulse) => (
                <div
                  key={pulse.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`px-1.5 py-0.2 rounded font-black uppercase ${
                        pulse.tag === 'WHALE_LIMIT'
                          ? 'bg-rose-950 border border-rose-600 text-rose-300'
                          : 'bg-cyan-950 border border-cyan-600 text-cyan-300'
                      }`}
                    >
                      {pulse.tag === 'WHALE_LIMIT' ? '🐋 WHALE LIMIT' : '⚡ STEAM SURGE'}
                    </span>
                    <span className="text-slate-500">{pulse.timestamp} &bull; {pulse.sportsbook}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-sans">{pulse.targetSelection}</span>
                    <span className="font-mono text-emerald-400 font-black">
                      +{formatCurrency(pulse.dollarDelta)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans">
                    <span>Matchup: <strong className="text-slate-300 font-mono">{pulse.matchup}</strong></span>
                    <span className="text-cyan-400 font-mono">+{pulse.unitDelta} tickets</span>
                  </div>

                  <p className="text-[10px] text-slate-500 font-sans pt-0.5 border-t border-slate-900">
                    {pulse.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Quick Guide */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 text-xs font-sans">
            <h4 className="font-bold text-white uppercase text-[11px] font-mono flex items-center gap-1.5">
              <span>📖</span>
              <span>How To Interpret Pre-Game Swings</span>
            </h4>
            <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <p>
                <strong className="text-cyan-300">1. Reverse Line Movement (RLM):</strong> When 60%+ of tickets are on 
                one side, but the spread moves in favor of the opponent, sportsbooks are reacting to heavy dollar handle 
                from respected syndicates.
              </p>
              <p>
                <strong className="text-emerald-300">2. Dollar-to-Ticket Divergence:</strong> If a team holds only 38% of 
                tickets but 74% of dollars, the average bet size is 4.5x larger, indicating professional whale money.
              </p>
              <p>
                <strong className="text-amber-300">3. Late Steam Surges:</strong> Sharp groups frequently wait until 
                30–45 minutes before kickoff when limits are highest to slam closing numbers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
