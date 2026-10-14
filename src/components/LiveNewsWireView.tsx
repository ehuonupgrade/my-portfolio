import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { playKeyClick, playSuccessChime } from '../utils/audio';
import { fetchLiveNewsWithFallback } from '../utils/liveSportsFeed';

export interface LiveNewsArticle {
  id: string;
  league: string;
  wireType: 'INJURY_INACTIVES' | 'SHARP_LINE_IMPACT' | 'BREAKING_NEWS';
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
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INJURY' | 'SHARP' | 'NFL'>('NFL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchNews = useCallback(async (isManual: boolean = false) => {
    setIsLoading(true);
    try {
      const data = await fetchLiveNewsWithFallback();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
        setFeedSource(data.source);
        setLastSynced(new Date().toLocaleTimeString());
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Tracked Stories</span>
            <span className="text-lg font-bold text-white">{articles.length}</span>
            <span className="text-[10px] text-slate-500 block">Active NFL Wire &amp; Reports</span>
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

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
            <span className="text-indigo-300 text-[11px] block">Last Live Sync</span>
            <span className="text-sm font-bold text-indigo-200 truncate">{lastSynced || 'Connecting...'}</span>
            <span className="text-[10px] text-emerald-400 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              ESPN API OK
            </span>
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
            const isInjury = article.wireType === 'INJURY_INACTIVES';
            const isSharp = article.wireType === 'SHARP_LINE_IMPACT';

            return (
              <div
                key={article.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                  isInjury
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
    </div>
  );
};
