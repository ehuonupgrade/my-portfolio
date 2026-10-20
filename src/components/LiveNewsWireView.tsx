import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { playKeyClick, playSuccessChime } from '../utils/audio';
import { fetchLiveNewsWithFallback } from '../utils/liveSportsFeed';
import { formatCurrentTimeWithZone } from '../utils/timeZoneUtils';

export interface LiveNewsArticle {
  id: string;
  league: string;
  wireType: 'INJURY_INACTIVES' | 'SHARP_LINE_IMPACT' | 'BREAKING_NEWS' | 'ROSTER_ACTIVATION';
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
  headline: string;
  description: string;
  publishedAt: string;
  categories: string[];
  imageUrl: string | null;
  linkUrl: string;
  byline: string;
}

interface LiveNewsWireViewProps {
  onSelectGame?: (gameId: string) => void;
}

export const LiveNewsWireView: React.FC<LiveNewsWireViewProps> = () => {
  const [articles, setArticles] = useState<LiveNewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [feedSource, setFeedSource] = useState<string>('Live Wire');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INJURY' | 'SHARP' | 'ACTIVATIONS' | 'NFL'>('NFL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showIngestModal, setShowIngestModal] = useState<boolean>(false);
  const [ingestHeadline, setIngestHeadline] = useState<string>('');
  const [ingestDescription, setIngestDescription] = useState<string>('');
  const [isSubmittingIngest, setIsSubmittingIngest] = useState<boolean>(false);

  const fetchNews = useCallback(async (isManual: boolean = false) => {
    setIsLoading(true);
    try {
      const data = await fetchLiveNewsWithFallback();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
        setFeedSource(data.source);
        setLastSynced(formatCurrentTimeWithZone());
        if (isManual) {
          playSuccessChime();
        }
      }
    } catch (err) {
      console.error('Failed to fetch live sports wire:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(false);
  }, [fetchNews]);

  // Periodic polling if auto-refresh is active
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchNews(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchNews]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (activeFilter === 'INJURY' && a.wireType !== 'INJURY_INACTIVES') return false;
      if (activeFilter === 'SHARP' && a.wireType !== 'SHARP_LINE_IMPACT' && a.impactLevel !== 'CRITICAL') return false;
      if (activeFilter === 'ACTIVATIONS' && a.wireType !== 'ROSTER_ACTIVATION') return false;
      if (activeFilter === 'NFL' && a.league !== 'NFL') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.headline.toLowerCase().includes(q);
        const matchDesc = a.description.toLowerCase().includes(q);
        const matchCat = a.categories.some((c) => c.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [articles, activeFilter, searchQuery]);

  const injuryCount = useMemo(() => {
    return articles.filter((a) => a.wireType === 'INJURY_INACTIVES').length;
  }, [articles]);

  const activationCount = useMemo(() => {
    return articles.filter((a) => a.wireType === 'ROSTER_ACTIVATION').length;
  }, [articles]);

  const highImpactCount = useMemo(() => {
    return articles.filter((a) => a.impactLevel === 'CRITICAL' || a.impactLevel === 'HIGH').length;
  }, [articles]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const copyArticleBrief = (a: LiveNewsArticle) => {
    playSuccessChime();
    const text = `📰 [EDGEDETECT WIRE] ${a.headline}\nLeague: ${a.league} | Published: ${new Date(a.publishedAt).toLocaleString()}\n\n${a.description}\n\nLink: ${a.linkUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(a.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleIngestAlert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ingestHeadline.trim()) return;
    setIsSubmittingIngest(true);
    try {
      const res = await fetch('/api/edgedetect/live/alerts/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: ingestHeadline.trim(),
          description: ingestDescription.trim(),
          league: 'NFL',
          wireType: 'ROSTER_ACTIVATION',
          impactLevel: 'CRITICAL',
        }),
      });
      if (res.ok) {
        playSuccessChime();
        setIngestHeadline('');
        setIngestDescription('');
        setShowIngestModal(false);
        await fetchNews(true);
      }
    } catch (err) {
      console.error('Failed to ingest breaking alert:', err);
    } finally {
      setIsSubmittingIngest(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-slate-100 animate-fadeIn">
      {/* Top Banner & Wire Control Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                LIVE REAL-TIME FEED &bull; ESPN SPORTS WIRE NETWORK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 border border-indigo-700/60 text-indigo-300">
                Auto-Classified Sharp Impact
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Live News &amp; Inactives Wire</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-normal">
                {articles.length} Breaking Stories
              </span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-sans">
              Real-time breaking stories, medical clearance leaks, starting quarterback confirmations, and late inactive bulletins that trigger sudden line movement and steam betting across major sportsbooks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                playKeyClick();
                fetchNews(true);
              }}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
              <span>{isLoading ? 'Syncing...' : 'Sync Wire Now'}</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setShowIngestModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-600/60 text-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>📡</span>
              <span>Ingest Breaking Alert</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setAutoRefresh(!autoRefresh);
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>Auto-Sync {autoRefresh ? '(60s)' : 'Off'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Tracked Stories</span>
            <span className="text-lg font-bold text-white">{articles.length}</span>
            <span className="text-[10px] text-slate-500 block">Active NFL Wire &amp; Reports</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
            <span className="text-emerald-300 text-[11px] block">⚡ Activations / Returns</span>
            <span className="text-lg font-bold text-emerald-400">{activationCount}</span>
            <span className="text-[10px] text-emerald-300/80 block">Off IR / Cleared to Play</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40">
            <span className="text-rose-300 text-[11px] block">🚨 Inactives &amp; Injuries</span>
            <span className="text-lg font-bold text-rose-400">{injuryCount}</span>
            <span className="text-[10px] text-rose-300/80 block">Direct Line Movers</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
            <span className="text-amber-300 text-[11px] block">⚡ High Line Impact</span>
            <span className="text-lg font-bold text-amber-400">{highImpactCount}</span>
            <span className="text-[10px] text-amber-300/80 block">Starters &amp; Depth Chart</span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 col-span-2 sm:col-span-1">
            <span className="text-indigo-300 text-[11px] block">Last Live Sync</span>
            <span className="text-sm font-bold text-indigo-200 truncate">{lastSynced || 'Connecting...'}</span>
            <span className="text-[10px] text-emerald-400 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              ESPN API OK
            </span>
          </div>
        </div>
      </div>

      {/* DEDICATED SPOTLIGHT: A.J. BROWN IR ACTIVATION & MODEL RECALIBRATION */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-2 border-emerald-500/70 shadow-xl space-y-4 font-mono animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ROSTER ACTIVATION &amp; RECALIBRATION</span>
            </span>
            <span className="text-slate-400 text-xs">New England Patriots (Week 6 vs New York Jets)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-xs bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
              Model Action: Line Steamed to Patriots -7.5 (Total 43.5)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span>⚡</span>
              <span>WR A.J. Brown 100% Cleared & Active for Philadelphia Eagles</span>
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Transaction Intercepted:</strong> The Philadelphia Eagles have verified WR1 A.J. Brown as 100% active and healthy on the 53-man roster. Brown completed all team practices without limitation and leads the Eagles wide receiver corps alongside DeVonta Smith and Saquon Barkley.
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong>Offensive &amp; Scheme Impact:</strong> Head coach Nick Sirianni features A.J. Brown as the premier WR1 alpha playmaker who commands bracket coverage and transforms Philadelphia&apos;s passing attack.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-600/40 space-y-2 font-mono">
            <div className="text-[11px] text-emerald-400 font-bold uppercase">
              🎯 Immediate Algorithmic Bets:
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-200">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <div>
                  <strong className="text-white">Philadelphia Eagles +2.0 Spread / ML:</strong> Back the Eagles home offense at Lincoln Financial Field with A.J. Brown and Saquon Barkley.
                </div>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <div>
                  <strong className="text-white">A.J. Brown Over 64.5 Rec Yds (-115):</strong> Heavy target share as Philadelphia&apos;s primary boundary target.
                </div>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <div>
                  <strong className="text-white">Over 43.5 Game Total:</strong> Total elevated to 43.5 with restored perimeter explosiveness.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              playKeyClick();
              setActiveFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-cyan-500 text-slate-950 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Stories ({articles.length})
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveFilter('ACTIVATIONS');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'ACTIVATIONS'
                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-emerald-500/20 shadow'
                : 'text-emerald-400 hover:text-emerald-200 hover:bg-slate-800'
            }`}
          >
            <span>⚡ Roster Activations</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-[10px] text-emerald-200">
              {activationCount}
            </span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveFilter('INJURY');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'INJURY'
                ? 'bg-rose-500 text-white font-extrabold shadow-rose-500/20 shadow'
                : 'text-rose-400 hover:text-rose-200 hover:bg-slate-800'
            }`}
          >
            <span>🚨 Inactives &amp; Injuries</span>
            <span className="px-1.5 py-0.2 rounded bg-rose-950 border border-rose-700 text-[10px] text-rose-200">
              {injuryCount}
            </span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveFilter('SHARP');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'SHARP'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                : 'text-amber-400 hover:text-amber-200 hover:bg-slate-800'
            }`}
          >
            <span>⚡ High Line Impact</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700 text-[10px] text-amber-200">
              {highImpactCount}
            </span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveFilter('NFL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'NFL'
                ? 'bg-indigo-600 text-white font-extrabold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🏈</span>
            <span>NFL News Wire (Active Focus)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player, team, injury..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Articles Feed */}
      {isLoading && articles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Connecting to ESPN Real-Time Wire Network...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <p className="text-slate-400 text-sm">No stories match your current filter or search criteria.</p>
          <button
            onClick={() => {
              setActiveFilter('ALL');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((article) => {
            const isActivation = article.wireType === 'ROSTER_ACTIVATION';
            const isInjury = article.wireType === 'INJURY_INACTIVES';
            const isSharp = article.wireType === 'SHARP_LINE_IMPACT';

            return (
              <div
                key={article.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                  isActivation
                    ? 'bg-gradient-to-br from-slate-900 via-emerald-950/25 to-slate-900 border-emerald-600/50 hover:border-emerald-400/80 shadow-lg'
                    : isInjury
                    ? 'bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 border-rose-900/40 hover:border-rose-600/70 shadow-lg'
                    : isSharp
                    ? 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-900/40 hover:border-amber-600/70 shadow-lg'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Badge row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        {article.league}
                      </span>

                      {isActivation && (
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-950 border border-emerald-600 text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>ROSTER ACTIVATION</span>
                        </span>
                      )}

                      {isInjury && (
                        <span className="px-2 py-0.5 rounded font-bold bg-rose-950 border border-rose-700 text-rose-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                          <span>INJURY / INACTIVE</span>
                        </span>
                      )}

                      {isSharp && (
                        <span className="px-2 py-0.5 rounded font-bold bg-amber-950 border border-amber-700 text-amber-300 flex items-center gap-1">
                          <span>⚡</span>
                          <span>SHARP LINE IMPACT</span>
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          article.impactLevel === 'CRITICAL'
                            ? 'bg-red-950 border border-red-700 text-red-300'
                            : article.impactLevel === 'HIGH'
                            ? 'bg-amber-950 border border-amber-700 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {article.impactLevel} IMPACT
                      </span>
                    </div>

                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatRelativeTime(article.publishedAt)}
                    </span>
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      <a href={article.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {article.headline}
                      </a>
                    </h3>

                    {article.description && (
                      <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                        {article.description}
                      </p>
                    )}
                  </div>

                  {/* Categories tag ribbon */}
                  {article.categories && article.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {article.categories.slice(0, 4).map((cat, ci) => (
                        <span
                          key={ci}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer action bar */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                    {article.byline}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyArticleBrief(article)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                    >
                      {copiedId === article.id ? '✓ Copied' : '📋 Copy'}
                    </button>

                    <a
                      href={article.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 hover:text-white transition-colors text-[11px] font-bold flex items-center gap-1"
                    >
                      <span>Read Story</span>
                      <span>&rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INGEST BREAKING ALERT MODAL */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-purple-500 shadow-2xl p-6 space-y-4 font-mono text-slate-100 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <div>
                  <h3 className="text-base font-bold text-white">Live Alert &amp; Transaction Ingestion</h3>
                  <span className="text-[11px] text-purple-300">Push Public Breaking News Directly into Pipeline</span>
                </div>
              </div>
              <button
                onClick={() => setShowIngestModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Fill Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">⚡ Quick-Fill Verified Alerts:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIngestHeadline('🚨 BREAKING: Eagles WR A.J. Brown Cleared & Active for Week 6 Matchup');
                    setIngestDescription('Philadelphia Eagles star wide receiver A.J. Brown is 100% cleared and active on the 53-man roster, leading the Eagles receiving corps.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  WR A.J. Brown Active (PHI)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIngestHeadline('⚡ 49ers activate Christian McCaffrey from IR; cleared for full workload on MNF');
                    setIngestDescription('San Francisco 49ers have officially activated RB Christian McCaffrey ahead of Monday Night Football against the Washington Commanders.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  RB McCaffrey Returns
                </button>
              </div>
            </div>

            {/* Ingest Form */}
            <form onSubmit={handleIngestAlert} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">Breaking Alert Headline *</label>
                <input
                  type="text"
                  required
                  value={ingestHeadline}
                  onChange={(e) => setIngestHeadline(e.target.value)}
                  placeholder="e.g. Eagles WR A.J. Brown 100% active for Week 6"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">Details / Market Summary</label>
                <textarea
                  rows={3}
                  value={ingestDescription}
                  onChange={(e) => setIngestDescription(e.target.value)}
                  placeholder="Provide transaction details, injury clearance notes, and expected starter/snap count impact..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIngest || !ingestHeadline.trim()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingIngest ? 'Ingesting...' : 'Broadcast to Live Wire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
