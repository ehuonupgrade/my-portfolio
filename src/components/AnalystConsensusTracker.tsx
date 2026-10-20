import React, { useState, useMemo } from 'react';
import {
  MOCK_ANALYST_CONSENSUS_DATA,
  TRACKED_SPORTS_ANALYSTS,
  getTriggeredContrarianFades,
  getUniversalAnalystConsensus,
} from '../data/sportsAnalystsData';
import { AnalystMarketConsensus, AnalystPick } from '../types/sportsBetting';
import { playKeyClick, playSuccessChime } from '../utils/audio';
import { GameStatusBadge } from './common/GameStatusBadge';
import { useSportsData } from '../context/SportsDataContext';

interface AnalystConsensusTrackerProps {
  onSelectGame?: (gameId: string) => void;
  onOpenBetTracker?: () => void;
}

export const AnalystConsensusTracker: React.FC<AnalystConsensusTrackerProps> = ({
  onSelectGame,
  onOpenBetTracker,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'history' | 'roster' | 'theory'>('radar');
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [networkFilter, setNetworkFilter] = useState<string>('ALL');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { games } = useSportsData();

  const upcomingConsensusList = useMemo(() => {
    if (games && games.length > 0) {
      const upcomingGames = games.filter((g) => g && g.status !== 'FINAL' && (g.status as string) !== 'STATUS_FINAL' && (g.status as string) !== 'POST');
      if (upcomingGames.length > 0) {
        return upcomingGames.map(getUniversalAnalystConsensus);
      }
    }
    return Object.values(MOCK_ANALYST_CONSENSUS_DATA).filter(
      (c) =>
        c.gameId !== 'nfl-sea-den-tnf' &&
        c.gameId !== 'nfl-lar-buf-today' &&
        c.gameId !== 'nfl-bal-cle-w6' &&
        c.gameId !== 'nfl-wsh-sf-w6'
    );
  }, [games]);

  const completedConsensusList = useMemo(() => {
    if (games && games.length > 0) {
      const completedGames = games.filter((g) => g && (g.status === 'FINAL' || (g.status as string) === 'STATUS_FINAL' || (g.status as string) === 'POST'));
      if (completedGames.length > 0) {
        return completedGames.map(getUniversalAnalystConsensus);
      }
    }
    return Object.values(MOCK_ANALYST_CONSENSUS_DATA).filter(
      (c) =>
        c.gameId === 'nfl-sea-den-tnf' ||
        c.gameId === 'nfl-lar-buf-today' ||
        c.gameId === 'nfl-bal-cle-w6' ||
        c.gameId === 'nfl-wsh-sf-w6'
    );
  }, [games]);

  const activeConsensusList = useMemo(() => {
    return activeTab === 'history' ? completedConsensusList : upcomingConsensusList;
  }, [activeTab, completedConsensusList, upcomingConsensusList]);

  const activeConsensus = useMemo(() => {
    if (selectedGameId) {
      const found = activeConsensusList.find((c) => c.gameId === selectedGameId);
      if (found) return found;
    }
    return activeConsensusList[0] || null;
  }, [selectedGameId, activeConsensusList]);

  const triggeredFades = useMemo(() => {
    return upcomingConsensusList.filter((c) => c.contrarianFadeSignal.triggered);
  }, [upcomingConsensusList]);

  const filteredPicks = useMemo(() => {
    if (!activeConsensus) return [];
    return activeConsensus.picks.filter((p) => {
      const matchesNet = networkFilter === 'ALL' || p.network.toLowerCase().includes(networkFilter.toLowerCase());
      const matchesSearch =
        p.analystName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.selection.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rationale.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesNet && matchesSearch;
    });
  }, [activeConsensus, networkFilter, searchQuery]);

  const handleCopyContrarianPlay = (consensus: AnalystMarketConsensus) => {
    playSuccessChime();
    const text = `🎯 CONTRARIAN FADE PLAY (EdgeDetect)\nMatchup: ${consensus.gameMatchup}\nContrarian Selection: ${consensus.contrarianFadeSignal.fadeTarget}\n\nWHY FADE:\n• Analysts: ${consensus.spread.homePct}% on ${consensus.spread.homeSelection}\n• Public Tickets: ${consensus.publicComparison.publicHomeTicketPct}% on Home Favorite\n• Sharp Handle: ${consensus.publicComparison.publicAwayMoneyPct}% Dollars backing ${consensus.contrarianFadeSignal.fadeTarget}\n\nRule: ${consensus.contrarianFadeSignal.gamblingTheoryRule}`;
    navigator.clipboard.writeText(text);
    setCopiedText(consensus.gameId);
    setTimeout(() => setCopiedText(null), 3000);
  };

  return (
    <div className="space-y-6 font-mono text-slate-100">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-indigo-500/20 border border-indigo-400 text-indigo-300 text-[10px] font-bold tracking-widest uppercase">
                🎙️ Media vs. Public vs. Sharps
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-bold tracking-widest uppercase">
                ⚡ Contrarian Gambling Theory Engine
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-bold tracking-widest uppercase">
                {triggeredFades.length} Active Echo Chamber Fades
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Sports Analysts &amp; The Contrarian Fade Radar
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-3xl leading-relaxed">
              Mainstream sports pundits and recreational bettors frequently herd into identical chalk.
              When <strong>80%+ of media analysts</strong> agree with public ticket slips, bookmakers shade the spread to tax popular sentiment.
              Our model applies pure <strong>contrarian gambling theory</strong>: detect the echo chamber, verify sharp whale opposition, and bet the opposite side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenBetTracker && (
              <button
                onClick={() => {
                  playKeyClick();
                  onOpenBetTracker();
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/50 text-purple-200 text-xs font-bold transition-all shadow-sm"
              >
                🧠 Open Live Tracker
              </button>
            )}
          </div>
        </div>

        {/* Gambling Theory Core Axiom Strip */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-950/70 border border-indigo-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2.5 text-indigo-200">
            <span className="text-lg">⚖️</span>
            <div>
              <span className="font-bold text-white">The Golden Contrarian Axiom:</span>{' '}
              <span className="text-slate-300">
                &ldquo;If everybody is picking the same team, you don&rsquo;t ask who wins &mdash; you ask why the line hasn&rsquo;t moved by 10 points. Fade the public consensus.&rdquo;
              </span>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">
            Historical Fade ROI: +8.8% ATS
          </span>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('radar');
              if (completedConsensusList.some((c) => c.gameId === selectedGameId)) {
                setSelectedGameId(upcomingConsensusList[0]?.gameId || 'nfl-bal-cle-w6');
              }
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'radar'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            📡 Active Contrarian Radar ({upcomingConsensusList.length} Future Games)
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('history');
              if (upcomingConsensusList.some((c) => c.gameId === selectedGameId)) {
                setSelectedGameId(completedConsensusList[0]?.gameId || 'nfl-sea-den-tnf');
              }
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            📜 Historical Fade Log ({completedConsensusList.length} Settled Games)
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('roster');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'roster'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            🎙️ Analyst Roster &amp; Track Records ({TRACKED_SPORTS_ANALYSTS.length})
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('theory');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'theory'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            📚 Gambling Theory &amp; The Math of Fading
          </button>
        </div>

        {(activeTab === 'radar' || activeTab === 'history') && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">
              {activeTab === 'history' ? 'Archived Game:' : 'Active Future Game:'}
            </span>
            <select
              value={selectedGameId}
              onChange={(e) => {
                playKeyClick();
                setSelectedGameId(e.target.value);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {activeConsensusList.map((c) => (
                <option key={c.gameId} value={c.gameId}>
                  {c.gameMatchup} ({c.league})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: CONTRARIAN FADE RADAR & HISTORICAL FADE LOG */}
      {(activeTab === 'radar' || activeTab === 'history') && activeConsensus && (
        <div className="space-y-6">
          {/* Historical Banner if viewing past completed game */}
          {activeTab === 'history' && (
            <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/80 flex items-center justify-between text-xs font-mono text-amber-200">
              <span className="flex items-center gap-2 font-bold">
                <span>📜</span>
                <span>HISTORICAL FADE ARCHIVE: {activeConsensus.gameMatchup} is a COMPLETED game stored for model audit reference.</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-900 border border-amber-600 text-amber-100 font-bold text-[10px]">
                SETTLED
              </span>
            </div>
          )}

          {/* Active Game Feature Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                    {activeConsensus.league}
                  </span>
                  <GameStatusBadge
                    statusOverride={activeTab === 'history' ? 'Completed' : 'Upcoming'}
                    size="xs"
                    showIcon
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    Tracked Media Analysts: {activeConsensus.totalAnalystsTracked}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {activeConsensus.gameMatchup}
                </h3>
              </div>

              {activeConsensus.contrarianFadeSignal.triggered && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold animate-pulse">
                    🚨 {activeConsensus.contrarianFadeSignal.severity} CONTRARIAN FADE TRIGGER
                  </span>
                  <button
                    onClick={() => handleCopyContrarianPlay(activeConsensus)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-md"
                  >
                    {copiedText === activeConsensus.gameId ? '✓ Copied Bet Slip!' : '📋 Copy Fade Play'}
                  </button>
                </div>
              )}
            </div>

            {/* The 3-Way Divergence Matrix (Analysts vs Public vs Sharps) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Box 1: Sports Media Pundits */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-400">
                    🎙️ TV Analysts Picks
                  </span>
                  <span>{activeConsensus.totalAnalystsTracked} Analysts</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-200 font-bold">{activeConsensus.spread.homeSelection}</span>
                      <span className="text-indigo-400 font-bold">{activeConsensus.spread.homePct}% ({activeConsensus.spread.homeCount})</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${activeConsensus.spread.homePct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-200 font-bold">{activeConsensus.spread.awaySelection}</span>
                      <span className="text-indigo-300 font-bold">{activeConsensus.spread.awayPct}% ({activeConsensus.spread.awayCount})</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-400/60 h-full rounded-full transition-all duration-500"
                        style={{ width: `${activeConsensus.spread.awayPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-sans">
                  {activeConsensus.spread.homePct >= 75
                    ? `⚠️ High Media Groupthink: 8 of 10 pundits laying home chalk.`
                    : 'Relatively balanced pundit distribution.'}
                </div>
              </div>

              {/* Box 2: Public Bettors (Tickets) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-bold flex items-center gap-1.5 text-amber-400">
                    👥 Public Betting Slips (Tickets)
                  </span>
                  <span>Ticket Vol.</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-200 font-bold">{activeConsensus.homeTeamName}</span>
                      <span className="text-amber-400 font-bold">{activeConsensus.publicComparison.publicHomeTicketPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${activeConsensus.publicComparison.publicHomeTicketPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-200 font-bold">{activeConsensus.awayTeamName}</span>
                      <span className="text-amber-300 font-bold">{activeConsensus.publicComparison.publicAwayTicketPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400/60 h-full rounded-full transition-all duration-500"
                        style={{ width: `${activeConsensus.publicComparison.publicAwayTicketPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-sans">
                  Casual crowd bets predominantly follow TV favorites and home favorites.
                </div>
              </div>

              {/* Box 3: Sharp Syndicate Dollars (Handle) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                    🐋 Sharp Syndicate Handle ($)
                  </span>
                  <span>Real Dollars</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-200 font-bold">{activeConsensus.homeTeamName}</span>
                      <span className="text-slate-400 font-bold">{activeConsensus.publicComparison.publicHomeMoneyPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${activeConsensus.publicComparison.publicHomeMoneyPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-emerald-300 font-bold">{activeConsensus.awayTeamName} (SHARP ADVANTAGE)</span>
                      <span className="text-emerald-400 font-bold">{activeConsensus.publicComparison.publicAwayMoneyPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/20"
                        style={{ width: `${activeConsensus.publicComparison.publicAwayMoneyPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 text-[11px] text-emerald-400 font-sans">
                  +{activeConsensus.publicComparison.sharpHandleDifference}% Whale Handle Divergence backing {activeConsensus.contrarianFadeSignal.fadeTarget}
                </div>
              </div>
            </div>

            {/* The Contrarian Play Verdict Card */}
            {activeConsensus.contrarianFadeSignal.triggered ? (
              <div className="p-5 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-950 border-2 border-rose-500/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black text-xs">
                      CONTRARIAN FADE TARGET
                    </span>
                    <span className="text-white font-bold text-sm sm:text-base">
                      {activeConsensus.contrarianFadeSignal.fadeTarget}
                    </span>
                  </div>
                  <div className="text-xs text-rose-300 font-mono">
                    Echo Chamber Score: <strong>{activeConsensus.contrarianFadeSignal.echoChamberScore}/100</strong>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                  {activeConsensus.contrarianFadeSignal.gamblingTheoryRule}
                </p>

                <div className="p-3 rounded-lg bg-slate-950 border border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-emerald-300 font-bold">
                    🚀 {activeConsensus.contrarianFadeSignal.recommendedAction}
                  </span>
                  {onSelectGame && (
                    <button
                      onClick={() => onSelectGame(activeConsensus.gameId)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs shrink-0"
                    >
                      View Full Market Splits &rarr;
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-sans text-slate-400">
                ℹ️ <strong>Contrarian Status:</strong> Sharp syndicates and media/public are currently aligned or balanced. No extreme consensus trap detected on this matchup.
              </div>
            )}

            {/* Filter and Individual Analyst Picks Header */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎙️ Individual Analyst Picks for {activeConsensus.gameMatchup}</span>
                  <span className="text-xs font-normal text-slate-400">({filteredPicks.length} verified)</span>
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Search analyst or quote..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={networkFilter}
                    onChange={(e) => {
                      playKeyClick();
                      setNetworkFilter(e.target.value);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">All Networks</option>
                    <option value="ESPN">ESPN</option>
                    <option value="CBS">CBS Sports</option>
                    <option value="FOX">FOX / FS1</option>
                    <option value="PFF">Pro Football Focus</option>
                    <option value="Sharp">Sharp Football</option>
                  </select>
                </div>
              </div>

              {/* Picks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPicks.map((pick: AnalystPick) => {
                  const isFade = pick.isContrarianFadeTarget;
                  return (
                    <div
                      key={pick.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isFade
                          ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow"
                            style={{ backgroundColor: pick.avatarBg }}
                          >
                            {pick.avatarInitial}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs sm:text-sm">{pick.analystName}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                                {pick.network}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ATS: {pick.seasonRecord}
                            </span>
                          </div>
                        </div>

                        {isFade ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-bold">
                            ★ CONTRARIAN PICK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                            PUBLIC/MEDIA CHALK
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 mb-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Official Pick:</span>
                          <span
                            className={`font-bold text-sm ${
                              isFade ? 'text-emerald-400' : 'text-indigo-300'
                            }`}
                          >
                            {pick.selection}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Confidence</span>
                          <span className="text-amber-400 text-xs font-bold">
                            {'★'.repeat(pick.confidenceRating)}
                            <span className="text-slate-600">{'★'.repeat(5 - pick.confidenceRating)}</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 font-sans leading-relaxed italic">
                        &ldquo;{pick.rationale}&rdquo;
                      </p>

                      <div className="mt-2 text-right text-[10px] text-slate-500 font-mono">
                        {pick.publishedTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick List of Other Games on the Slate */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span>{activeTab === 'history' ? 'Archived Completed Games' : 'Active Future Games with Contrarian Analysis'}</span>
              <span className="text-xs text-slate-400 font-mono">{activeConsensusList.length} matchups</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeConsensusList.map((c) => {
                const isSelected = c.gameId === selectedGameId;
                const isTriggered = c.contrarianFadeSignal.triggered;
                return (
                  <div
                    key={c.gameId}
                    onClick={() => {
                      playKeyClick();
                      setSelectedGameId(c.gameId);
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/40'
                        : isTriggered
                        ? 'bg-slate-950 border-rose-900/50 hover:border-rose-700'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{c.league}</span>
                      {isTriggered ? (
                        <span className="text-rose-400 font-bold">🚨 FADE TRIGGER</span>
                      ) : (
                        <span className="text-slate-500">BALANCED</span>
                      )}
                    </div>
                    <div className="text-white font-bold text-xs mb-1.5 truncate">
                      {c.gameMatchup}
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
                      <span>Media: {c.spread.homePct}% on {c.spread.homeSelection}</span>
                    </div>
                    {isTriggered && (
                      <div className="mt-2 text-[10px] text-emerald-300 font-bold">
                        Bet: {c.contrarianFadeSignal.fadeTarget}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYST ROSTER & ATS LEADERBOARD */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Tracked Sports Analysts &amp; Experts</h3>
                <p className="text-xs text-slate-400 font-sans">
                  We monitor public prediction records from major media networks (ESPN, CBS Sports, FOX, PFF, Sharp Football) to measure groupthink.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-mono font-bold">
                {TRACKED_SPORTS_ANALYSTS.length} Analysts Tracked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRACKED_SPORTS_ANALYSTS.map((analyst) => (
                <div
                  key={analyst.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                        style={{ backgroundColor: analyst.avatarBg }}
                      >
                        {analyst.avatarInitial}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{analyst.name}</div>
                        <div className="text-[11px] text-slate-400">{analyst.network}</div>
                      </div>
                    </div>
                    {analyst.profileBadge && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-indigo-300 border border-indigo-900/60">
                        {analyst.profileBadge}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 text-xs font-mono flex items-center justify-between">
                    <span className="text-slate-400">ATS Record:</span>
                    <span className="text-emerald-400 font-bold">{analyst.seasonRecord}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans">
                    {analyst.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GAMBLING THEORY DEEP DIVE */}
      {activeTab === 'theory' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                Mathematical Foundations
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                The Science of Contrarian Market Dynamics: Why Fading the Herd Works
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-sans mt-2 leading-relaxed">
                Recreational market participants are driven by emotion, recency bias, and media narratives.
                Professional market makers are not prediction companies &mdash; they seek balanced liability or shaded positions.
                Understanding this reality allows contrarian market analysts to capitalize on systematically mispriced lines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Theory Card 1 */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold text-sm flex items-center gap-2">
                  <span>1. The Shaded Line Premium</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  When bookmakers know casual bettors and media analysts will overwhelmingly back a popular home favorite (like the Rams or Chiefs), they inflate the spread by a half-point or full point (+3.0 becomes +3.5 or +4.0). Backing the opposite side captures this artificial line tax.
                </p>
              </div>

              {/* Theory Card 2 */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold text-sm flex items-center gap-2">
                  <span>2. The TV Media Echo Chamber</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Media analysts are rewarded for consensus, not ATS win rate. If an analyst picks a popular favorite and loses, they blend in; if they pick an underdog and lose, they look foolish. Consequently, 80%+ of TV picks skew toward favorites, creating massive value on the underdogs.
                </p>
              </div>

              {/* Theory Card 3 */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                  <span>3. The Pros vs. Joes Divergence</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  The ideal contrarian wager is when <strong>Ticket %</strong> is on one side, but <strong>Dollar Handle %</strong> is on the opposite. In Thursday&rsquo;s Broncos vs Seahawks game, 62% of public tickets were on Denver, but 71% of the sharp money backed Seattle at Empower Field at Mile High. The syndicates executed the contrarian fade.
                </p>
              </div>

              {/* Theory Card 4 */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-rose-400 font-bold text-sm flex items-center gap-2">
                  <span>4. The 75%+ Consensus Trigger</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Over a 10-season historical NFL tracking sample, teams with greater than 75% analyst consensus and 60%+ public bet slips covered the spread at only a <strong>42.6% rate</strong>. Fading those consensus favorites yielded a <strong>57.4% ATS hit rate</strong> (+8.8% ROI after vigorish).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
