import React, { useState, useEffect, useMemo } from 'react';
import { FeedbackItem, FeedbackStatus, FeedbackCategory } from '../types/feedback';
import {
  getFeedbackInventory,
  upvoteFeedbackItem,
  hasUserVoted,
  updateFeedbackStatusByOwner,
} from '../utils/feedbackStore';
import { playKeyClick, playSuccessChime, playBeep } from '../utils/audio';
import { FeedbackModal } from './FeedbackModal';
import { TrafficAnalyticsCard } from './TrafficAnalyticsCard';

interface FeedbackInventoryViewProps {
  onBack?: () => void;
}

export const FeedbackInventoryView: React.FC<FeedbackInventoryViewProps> = ({ onBack }) => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<FeedbackItem | null>(null);

  // Site Owner / Development Staff Admin Review Controls State
  const [isOwnerReviewMode, setIsOwnerReviewMode] = useState<boolean>(false);
  const [reviewNotesDraft, setReviewNotesDraft] = useState<string>('');
  const [commitDraft, setCommitDraft] = useState<string>('');
  const [adminFeedbackNotice, setAdminFeedbackNotice] = useState<string | null>(null);

  const loadData = async () => {
    const data = await getFeedbackInventory();
    setItems(data);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('huon_feedback_updated', handleUpdate);
    const interval = setInterval(loadData, 12000); // Poll every 12s for new global community submissions
    return () => {
      window.removeEventListener('huon_feedback_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesAuthor = item.submittedBy.toLowerCase().includes(q);
        const matchesTarget = item.targetPageOrComponent.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesTarget) return false;
      }
      return true;
    }).sort((a, b) => {
      // Prioritize deployed items, then upvotes
      if (a.status === 'deployed' && b.status !== 'deployed') return -1;
      if (b.status === 'deployed' && a.status !== 'deployed') return 1;
      return b.upvotes - a.upvotes;
    });
  }, [items, filterCategory, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const deployed = items.filter((i) => i.status === 'deployed').length;
    const inPipeline = items.filter((i) => i.status === 'in_pipeline' || i.status === 'approved').length;
    const acknowledged = items.filter((i) => i.status === 'acknowledged').length;
    const totalVotes = items.reduce((acc, i) => acc + i.upvotes, 0);
    return { total, deployed, inPipeline, acknowledged, totalVotes };
  }, [items]);

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasUserVoted(id)) {
      playBeep();
      return;
    }
    playKeyClick();
    const res = await upvoteFeedbackItem(id);
    if (res.success) {
      loadData();
    }
  };

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    playKeyClick();
    const updated = await updateFeedbackStatusByOwner(
      id,
      newStatus,
      reviewNotesDraft.trim() || undefined,
      commitDraft.trim() || undefined
    );
    if (updated) {
      playSuccessChime();
      setSelectedItemForDetail(updated);
      setAdminFeedbackNotice(`Status successfully updated to "${newStatus.toUpperCase()}"!`);
      setTimeout(() => setAdminFeedbackNotice(null), 3500);
      loadData();
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'deployed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 flex items-center gap-1 shadow-xs">
            <span>✓</span>
            <span>DEPLOYED</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 flex items-center gap-1">
            <span>★</span>
            <span>FEASIBILITY APPROVED</span>
          </span>
        );
      case 'in_pipeline':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-950/80 border border-purple-500/80 text-purple-300 flex items-center gap-1 animate-pulse">
            <span>⚙</span>
            <span>AGENT PIPELINE</span>
          </span>
        );
      case 'acknowledged':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-950/80 border border-amber-500/80 text-amber-300 flex items-center gap-1">
            <span>👀</span>
            <span>ACKNOWLEDGED</span>
          </span>
        );
      case 'submitted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
            <span>📥</span>
            <span>LOGGED IN INVENTORY</span>
          </span>
        );
      case 'deferred':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-900 border border-slate-800 text-slate-400">
            DEFERRED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-slate-800/90 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-mono"
                >
                  <span>&larr;</span>
                  <span>Back</span>
                </button>
              )}
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AUTONOMOUS RECURSIVE ENHANCEMENT ENGINE</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>Feedback &amp; Evolution Inventory</span>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                {items.length} Tracked Recommendations
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              Public inventory for user feedback across every aspect of this website (Kids Activity Hub, BART Planner, RoboInvestor, Games, Navigation). Recommendations undergo automated feasibility synthesis, review by development staff and site owner, and recursive deployment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 font-mono text-xs">
            <button
              onClick={() => {
                playKeyClick();
                setIsSubmitModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <span>✨</span>
              <span>Submit Recommendation</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setIsOwnerReviewMode(!isOwnerReviewMode);
              }}
              className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isOwnerReviewMode
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300 font-bold shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle Development Staff &amp; Site Owner Review Mode"
            >
              <span>{isOwnerReviewMode ? '🛡️' : '⚙️'}</span>
              <span>{isOwnerReviewMode ? 'Admin Mode (Active)' : 'Owner Review Mode'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase">Total Logged</div>
            <div className="text-white font-bold text-lg">{stats.total} Requests</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-emerald-400 uppercase">Live Deployed</div>
            <div className="text-emerald-400 font-bold text-lg">{stats.deployed} Built</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-cyan-400 uppercase">In Pipeline</div>
            <div className="text-cyan-400 font-bold text-lg">{stats.inPipeline} Active</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-amber-400 uppercase">Acknowledged</div>
            <div className="text-amber-300 font-bold text-lg">{stats.acknowledged} Triage</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-purple-400 uppercase">Community Votes</div>
            <div className="text-purple-300 font-bold text-lg">{stats.totalVotes} Upvotes</div>
          </div>
        </div>
      </div>

      {/* Owner Review Mode Alert Banner */}
      {isOwnerReviewMode && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-600/70 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-300 flex items-center gap-1.5 uppercase">
              <span>🛡️</span>
              <span>Owner &amp; Development Staff Decision Deck</span>
            </span>
            <span className="text-[10px] text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-700">
              RECURSIVE AUTOMATION PREVIEW
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            As administrator, you can transition requests through the lifecycle: <strong>Acknowledged &rarr; In Pipeline &rarr; Feasibility Approved &rarr; Deployed</strong>. This lays the real contract structure for autonomous agents to propose code diffs and await human verification.
          </p>
        </div>
      )}

      {/* Lightweight Anonymized Traffic & Attention Analytics Card */}
      <TrafficAnalyticsCard />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Query */}
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recommendations, specs, tags..."
              className="w-full px-3 py-2 pl-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
            />
            <span className="absolute left-2.5 top-2.5 text-slate-500 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
            >
              <option value="all">All Project Categories ({items.length})</option>
              <option value="toddler-activities">🧸 Kids Activity Hub</option>
              <option value="bart-planner">🚆 BART Schedule Planner</option>
              <option value="roboinvestor">🤖 RoboInvestor Agent</option>
              <option value="ui-design">🎨 UI &amp; Navigation Design</option>
              <option value="performance">⚡ Performance &amp; PWA</option>
              <option value="general">🌐 General Website</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
            >
              <option value="all">All Statuses ({items.length})</option>
              <option value="deployed">✓ Deployed ({stats.deployed})</option>
              <option value="approved">★ Feasibility Approved</option>
              <option value="in_pipeline">⚙ In Agent Pipeline</option>
              <option value="acknowledged">👀 Acknowledged ({stats.acknowledged})</option>
              <option value="submitted">📥 Logged in Inventory</option>
            </select>
          </div>
        </div>

        {/* Quick Reset / Info */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
          <span>
            Displaying <strong className="text-white">{filteredItems.length}</strong> matching feedback recommendations
          </span>
          {(filterCategory !== 'all' || filterStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFilterCategory('all');
                setFilterStatus('all');
                setSearchQuery('');
              }}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Item List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3 font-mono">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
              📥
            </div>
            <h3 className="text-base font-bold text-white font-sans">
              {items.length === 0
                ? 'Production Feedback Inventory Ready (0 Requests)'
                : 'No recommendations match your search filter'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {items.length === 0
                ? 'This feedback and recursive enhancement pipeline has just launched. As real visitors and users submit recommendations for any project or feature, they will be logged, analyzed for feasibility, and tracked live here.'
                : 'Try adjusting or clearing your search keywords and status filters to see other entries.'}
            </p>
            <div className="pt-1">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <span>✨</span>
                <span>Submit First Production Recommendation</span>
              </button>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const hasVoted = hasUserVoted(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  playKeyClick();
                  setSelectedItemForDetail(item);
                  setReviewNotesDraft(item.agentAnalysis.ownerNotes || '');
                  setCommitDraft(item.agentAnalysis.deployedCommit || '');
                }}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-md space-y-3 group ${
                  item.status === 'deployed'
                    ? 'bg-slate-900/70 border-emerald-900/60 hover:border-emerald-500/70'
                    : item.status === 'approved' || item.status === 'in_pipeline'
                    ? 'bg-slate-900/70 border-cyan-900/60 hover:border-cyan-500/70'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Category, Target & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 font-semibold">
                      {item.categoryLabel}
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-slate-400 text-[11px] truncate max-w-xs">
                      Target: {item.targetPageOrComponent}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Main Content & Upvote Button */}
                <div className="flex items-start gap-4">
                  {/* Upvote Pill */}
                  <button
                    onClick={(e) => handleUpvote(item.id, e)}
                    disabled={hasVoted}
                    className={`shrink-0 flex flex-col items-center justify-center w-14 py-2 rounded-xl border transition-all cursor-pointer font-mono ${
                      hasVoted
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-emerald-600 active:scale-95'
                    }`}
                    title={hasVoted ? 'You already upvoted this request' : 'Click to upvote'}
                  >
                    <span className="text-sm">{hasVoted ? '▲' : '△'}</span>
                    <span className="text-xs font-bold">{item.upvotes}</span>
                    <span className="text-[9px] uppercase tracking-tighter text-slate-500">Votes</span>
                  </button>

                  {/* Title & Description */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    {/* Agent Feasibility & Owner Notes Peek */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-300">
                        <span>🤖 Feasibility:</span>
                        <strong className="text-emerald-400">{item.agentAnalysis.feasibilityScore}%</strong>
                        <span>({item.agentAnalysis.estimatedComplexity})</span>
                      </span>

                      {item.agentAnalysis.ownerNotes && (
                        <span className="text-purple-300 flex items-center gap-1 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                          <span>Staff Note:</span>
                          <span className="truncate max-w-sm">{item.agentAnalysis.ownerNotes}</span>
                        </span>
                      )}

                      {item.agentAnalysis.deployedCommit && (
                        <span className="text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          commit {item.agentAnalysis.deployedCommit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL & ADMIN REVIEW MODAL */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedItemForDetail(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl cursor-pointer p-1"
            >
              &times;
            </button>

            {/* Header info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 font-semibold">
                  {selectedItemForDetail.categoryLabel}
                </span>
                {getStatusBadge(selectedItemForDetail.status)}
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-400">ID: {selectedItemForDetail.id}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{selectedItemForDetail.title}</h3>
              <div className="text-xs text-slate-400 font-mono">
                Submitted by <strong>{selectedItemForDetail.submittedBy}</strong> &bull;{' '}
                {new Date(selectedItemForDetail.submittedAt).toLocaleString()}
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">
                Requested Recommendation:
              </div>
              {selectedItemForDetail.description}
            </div>

            {/* Target component */}
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <span>Target Aspect:</span>
              <strong className="text-white">{selectedItemForDetail.targetPageOrComponent}</strong>
            </div>

            {/* Agent Automated Feasibility Analysis */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase text-[11px]">
                  <span>🤖</span>
                  <span>Agent Feasibility &amp; Spec Synthesis</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Feasibility Score: <strong className="text-emerald-300">{selectedItemForDetail.agentAnalysis.feasibilityScore}/100</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Complexity: </span>
                  <span className="text-white uppercase font-bold">{selectedItemForDetail.agentAnalysis.estimatedComplexity}</span>
                </div>
                <div>
                  <span className="text-slate-500">Technical Impact: </span>
                  <span className="text-white uppercase font-bold">{selectedItemForDetail.agentAnalysis.technicalImpact}</span>
                </div>
              </div>

              {selectedItemForDetail.agentAnalysis.proposedChangeSpec && (
                <div className="pt-1">
                  <div className="text-[10px] text-slate-500 uppercase">Change Specification:</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {selectedItemForDetail.agentAnalysis.proposedChangeSpec}
                  </div>
                </div>
              )}

              {selectedItemForDetail.agentAnalysis.automatedTestPlan && (
                <div className="pt-1">
                  <div className="text-[10px] text-slate-500 uppercase">Automated Verification Plan:</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {selectedItemForDetail.agentAnalysis.automatedTestPlan}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Notice */}
            {adminFeedbackNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500 text-xs font-mono text-emerald-300 animate-fadeIn">
                ✓ {adminFeedbackNotice}
              </div>
            )}

            {/* Owner Review & Deployment Controls (Available in Owner Mode) */}
            {isOwnerReviewMode ? (
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-3 font-mono text-xs">
                <div className="font-bold text-purple-300 flex items-center justify-between">
                  <span>🛡️ Site Owner &amp; Development Staff Gate:</span>
                  <span className="text-[10px] text-purple-400">One-click deployment pipeline</span>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">Owner / Staff Review Notes &amp; Rationale</label>
                  <input
                    type="text"
                    value={reviewNotesDraft}
                    onChange={(e) => setReviewNotesDraft(e.target.value)}
                    placeholder="e.g. Approved. Deployed in v0.9.4 patch."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">Deployed Git Commit Hash (Optional)</label>
                  <input
                    type="text"
                    value={commitDraft}
                    onChange={(e) => setCommitDraft(e.target.value)}
                    placeholder="e.g. 8d1a92e"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => handleStatusChange(selectedItemForDetail.id, 'acknowledged')}
                    className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-200 text-[11px] font-bold cursor-pointer"
                  >
                    👀 Acknowledge
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedItemForDetail.id, 'in_pipeline')}
                    className="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-600 text-purple-200 text-[11px] font-bold cursor-pointer"
                  >
                    ⚙ Send to Pipeline
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedItemForDetail.id, 'approved')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-200 text-[11px] font-bold cursor-pointer"
                  >
                    ★ Approve Feasibility
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedItemForDetail.id, 'deployed')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold cursor-pointer shadow-md"
                  >
                    ✓ Mark DEPLOYED
                  </button>
                </div>
              </div>
            ) : (
              selectedItemForDetail.agentAnalysis.ownerNotes && (
                <div className="p-3 rounded-xl bg-slate-950 border border-purple-900/40 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-purple-400 uppercase font-bold">Owner Review Notes:</div>
                  <div className="text-slate-200">{selectedItemForDetail.agentAnalysis.ownerNotes}</div>
                </div>
              )
            )}

            <div className="flex items-center justify-between pt-2 font-mono text-xs">
              <button
                onClick={(e) => handleUpvote(selectedItemForDetail.id, e)}
                disabled={hasUserVoted(selectedItemForDetail.id)}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer flex items-center gap-1.5 ${
                  hasUserVoted(selectedItemForDetail.id)
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>▲ Upvote ({selectedItemForDetail.upvotes})</span>
              </button>

              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION MODAL */}
      <FeedbackModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitted={() => loadData()}
      />
    </div>
  );
};
