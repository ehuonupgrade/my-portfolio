import React, { useState } from 'react';
import { FeedbackCategory, FeedbackType } from '../types/feedback';
import { submitNewFeedback } from '../utils/feedbackStore';
import { playKeyClick, playSuccessChime, playBeep } from '../utils/audio';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: FeedbackCategory;
  defaultTarget?: string;
  onSubmitted?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'general',
  defaultTarget = 'General Website / Any Aspect',
  onSubmitted,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [type, setType] = useState<FeedbackType>('feature_request');
  const [submittedBy, setSubmittedBy] = useState('');
  const [email, setEmail] = useState('');
  const [target, setTarget] = useState(defaultTarget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      playBeep();
      setErrorMsg('Please provide a title and detailed description for your recommendation.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const categoryLabels: Record<FeedbackCategory, string> = {
        'general': 'General Website',
        'toddler-activities': 'Kids Activity Hub',
        'bart-planner': 'BART Planner',
        'roboinvestor': 'RoboInvestor Agent',
        'cosmic-game': 'Cosmic Defender Game',
        'ui-design': 'UI / Visual System',
        'performance': 'Performance & Architecture',
      };

      submitNewFeedback({
        title: title.trim(),
        description: description.trim(),
        category,
        categoryLabel: categoryLabels[category] || 'General',
        type,
        submittedBy: submittedBy.trim() || 'Anonymous Visitor',
        email: email.trim() || undefined,
        targetPageOrComponent: target.trim() || 'huon.si',
        feasibility: 'pending',
      });

      playSuccessChime();
      setSubmittedSuccess(true);
      if (onSubmitted) onSubmitted();

      setTimeout(() => {
        setTitle('');
        setDescription('');
        setSubmittedBy('');
        setEmail('');
        setSubmittedSuccess(false);
        setIsSubmitting(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
      playBeep();
      setErrorMsg('Failed to record feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={() => {
            playKeyClick();
            onClose();
          }}
          className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl cursor-pointer p-1"
          aria-label="Close Modal"
        >
          &times;
        </button>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-3 font-mono">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl text-emerald-300 animate-bounce">
              ✓
            </div>
            <h3 className="text-xl font-bold text-white font-sans">Recommendation Logged!</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your feedback is now publicly inventoried in the <strong>Evolution &amp; Roadmap Hub</strong>. The agent pipeline will synthesize technical feasibility for development staff and site owner review and deployment.
            </p>
            <div className="text-[11px] text-emerald-400">Added to live queue &bull; Thank you!</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>COMMUNITY EVOLUTION PIPELINE &bull; RECURSIVE ENHANCEMENT</span>
              </span>
              <h3 className="text-xl font-bold text-white">Provide Feedback / Request Enhancement</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Suggest any enhancement, report a bug, or propose new features. All inputs are logged into a public inventory, evaluated for feasibility, and tracked through deployment.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/60 text-xs text-red-200 font-mono">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Aspect / Area</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="general">🌐 General Website</option>
                  <option value="toddler-activities">🧸 Kids Activity Hub</option>
                  <option value="bart-planner">🚆 BART Schedule Planner</option>
                  <option value="roboinvestor">🤖 RoboInvestor Agent</option>
                  <option value="cosmic-game">🎮 Cosmic Defender Game</option>
                  <option value="ui-design">🎨 UI &amp; Navigation Design</option>
                  <option value="performance">⚡ Performance &amp; Offline PWA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Feedback Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="feature_request">✨ Feature Request</option>
                  <option value="ux_improvement">🎯 UX / Usability Tweak</option>
                  <option value="bug_report">🐞 Bug Report</option>
                  <option value="data_source">📊 Data Source / Link Update</option>
                  <option value="other">💬 General Suggestion</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-400">
                Title / Summary <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Add calendar export (.ics) to class booking confirmation"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-400">
                Detailed Description &amp; Desired Behavior <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Explain what you want improved, why it helps, and any specifics (what page, which buttons, expected data)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono leading-relaxed resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Your Name / Handle (Optional)</label>
                <input
                  type="text"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  placeholder="Anonymous or Name"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email for Deploy Alerts (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 font-mono">
              <button
                type="button"
                onClick={() => {
                  playKeyClick();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <span>🚀</span>
                <span>{isSubmitting ? 'Logging...' : 'Submit to Inventory'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
