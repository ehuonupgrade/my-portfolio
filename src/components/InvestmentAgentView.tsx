import React, { useState } from 'react';
import agentData from '../data/investment_agent.json';
import { playKeyClick } from '../utils/audio';

type AgentSection = 'decisions' | 'constraints' | 'history';

interface InvestmentAgentViewProps {
  onBack?: () => void;
}

export const InvestmentAgentView: React.FC<InvestmentAgentViewProps> = ({ onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState<AgentSection>('decisions');

  const getActionColor = (action: string) => {
    if (action.includes('BUY')) {
      return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
    }
    if (action.includes('SELL') || action.includes('TRIM')) {
      return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
    }
    return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';
  };

  return (
    <div className="space-y-8 font-sans animate-fadeIn">
      {/* Breadcrumb Navigation */}
      {onBack && (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <button
            onClick={() => {
              playKeyClick();
              onBack();
            }}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>&larr;</span>
            <span>My Projects</span>
          </button>
          <span>/</span>
          <span className="text-emerald-400 font-semibold">{agentData.projectTitle}</span>
        </div>
      )}

      {/* Project Header & Agent Status Banner */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 sm:p-7 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                {agentData.platform}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {agentData.projectTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
              STATUS: <strong className="text-emerald-400">{agentData.status}</strong>
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          {agentData.philosophy}
        </p>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <button
            onClick={() => {
              playKeyClick();
              setActiveSubTab('decisions');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeSubTab === 'decisions'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            Decision Ledger &amp; Rationale
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveSubTab('constraints');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeSubTab === 'constraints'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            Active Constraints (Rulebook)
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveSubTab('history');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            Constraint Evolution History
          </button>
        </div>
      </div>

      {/* SECTION 1: DECISION LEDGER & WHY */}
      {activeSubTab === 'decisions' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>PUBLIC AUDIT TRAIL</span>
            <span>SHOWING {agentData.decisionLog.length} RECENT ACTIONS</span>
          </div>

          <div className="space-y-4">
            {agentData.decisionLog.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-4 hover:border-slate-700/80 transition-colors"
              >
                {/* Header row: Action, Symbol, Price, Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold font-mono px-3 py-1 rounded-lg border ${getActionColor(
                        item.action
                      )}`}
                    >
                      {item.action}
                    </span>
                    <span className="text-xl font-bold text-white tracking-tight">
                      {item.ticker}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      @ {item.executionPrice}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>{item.amount}</span>
                    <span aria-hidden="true">&bull;</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>

                {/* The "Why" - Decision Rationale */}
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Why the agent decided this:
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {item.why}
                  </p>
                </div>

                {/* Constraints Verified */}
                <div className="pt-2 border-t border-slate-800/40 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Constraints Evaluated &amp; Satisfied:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {item.constraintsVerified.map((rule, rIdx) => (
                      <div
                        key={rIdx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-slate-300 font-mono text-[11px]"
                      >
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="truncate">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: ACTIVE CONSTRAINTS */}
      {activeSubTab === 'constraints' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Active Investment Constraints
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hard programmatic rules the Robinhood agent cannot violate, irrespective of market sentiment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agentData.activeConstraints.map((constraint) => (
              <div
                key={constraint.id}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    {constraint.category}
                  </span>
                  <span className="font-mono text-white font-bold">{constraint.value}</span>
                </div>

                <h4 className="text-base font-bold text-white tracking-tight">
                  {constraint.name}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {constraint.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CONSTRAINT EVOLUTION HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Constraint Evolution &amp; Strategic Adjustments
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Documenting how and why investment boundaries were refined over time as market dynamics shifted.
            </p>
          </div>

          <div className="space-y-4">
            {agentData.constraintHistory.map((history, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {history.constraint}
                  </h4>
                  <span className="text-xs font-mono text-slate-400">{history.date}</span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-red-950/60 border border-red-900/60 text-red-300 line-through">
                    {history.previousValue}
                  </span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-bold">
                    {history.updatedValue}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Reason for Adjustment:
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {history.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
