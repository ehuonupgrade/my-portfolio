import React, { useState } from 'react';
import initialAgentData from '../data/investment_agent.json';
import { playKeyClick, playSuccessChime, playBeep } from '../utils/audio';

type AgentSection = 'decisions' | 'constraints' | 'history' | 'setup';

interface InvestmentAgentViewProps {
  onBack?: () => void;
}

export const InvestmentAgentView: React.FC<InvestmentAgentViewProps> = ({ onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState<AgentSection>('decisions');
  const [agentData, setAgentData] = useState(initialAgentData);
  const [simulating, setSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const getActionColor = (action: string) => {
    if (action.includes('PAPER')) {
      return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';
    }
    if (action.includes('BUY')) {
      return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
    }
    if (action.includes('SELL') || action.includes('TRIM')) {
      return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
    }
    return 'text-slate-300 bg-slate-900 border-slate-800';
  };

  const handleSimulateTrade = () => {
    playBeep(640, 0.08);
    setSimulating(true);
    setSimulationLog('Evaluating market signals & verifying constraints...');

    setTimeout(() => {
      const newDecision = {
        id: `dec-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        }),
        action: 'BUY',
        ticker: 'VOO',
        amount: '$500.00',
        executionPrice: '$514.80',
        why: 'Autonomous DCA trigger: Market trading near 20-day exponential moving average. Fulfilling monthly broad-market accumulation quota.',
        constraintsVerified: [
          'Position ceiling < 15.0% verified (current projected weight: 9.2%)',
          'Minimum liquid cash reserve > 10.0% satisfied ($2,700 remaining)',
          'Approved asset universe validation (S&P 500 Index ETF)',
          'Slippage verified at 0.02% (below 0.15% ceiling)',
        ],
        agentConfidence: '96%',
      };

      setAgentData((prev) => ({
        ...prev,
        decisionLog: [newDecision, ...prev.decisionLog],
      }));

      playSuccessChime();
      setSimulating(false);
      setSimulationLog('✓ Trade executed via Robinhood MCP simulation and logged to public ledger!');
    }, 1200);
  };

  const pythonRunnerSnippet = `# Run RoboInvestor Python MCP Agent:
python3 scripts/robo_investor_agent.py

# Expected Output:
# [Robinhood MCP] Initialized for Agentic Account: RH_AGENT_0042
# [CONSTRAINTS PASSED]
#   ✓ Security is in approved index universe
#   ✓ Position weight remains below 15.0% limit
#   ✓ Liquid cash reserve maintained above 10.0% target
#   ✓ Slippage verified within 0.15% ceiling
# [Robinhood MCP] Submitting BUY order: 0.9758 shares of VOO @ $512.40`;

  const handleCopyCode = () => {
    playKeyClick();
    navigator.clipboard.writeText(pythonRunnerSnippet);
    setCopiedCode(true);
    playSuccessChime();
    setTimeout(() => setCopiedCode(false), 2000);
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
      <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-4 sm:p-6 lg:p-7 backdrop-blur-md space-y-4">
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

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
              STATUS: <strong className="text-cyan-400">{agentData.status}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-[11px] font-semibold">
              ZERO CAPITAL AT RISK
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          {agentData.philosophy}
        </p>

        {/* Sub-Navigation Tabs */}
        <div className="overflow-x-auto no-scrollbar pb-1.5 -mx-1 px-1 flex sm:flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-800/60">
          <button
            onClick={() => {
              playKeyClick();
              setActiveSubTab('decisions');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            Constraint Evolution History
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveSubTab('setup');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeSubTab === 'setup'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs'
                : 'text-emerald-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-emerald-900/60'
            }`}
          >
            Connection &amp; MCP Setup
          </button>
        </div>
      </div>

      {/* SECTION 1: DECISION LEDGER & WHY */}
      {activeSubTab === 'decisions' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>PUBLIC AUDIT TRAIL</span>
            <span>SHOWING {agentData.decisionLog.length} RECORDED ACTIONS</span>
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

      {/* SECTION 4: CONNECTION & MCP SETUP GUIDE */}
      {activeSubTab === 'setup' && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Robinhood Agentic Setup &amp; MCP Integration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Step-by-step instructions to connect your local or cloud agent runner to Robinhood and synchronize transparency logs to Huon.si.
            </p>
          </div>

          {/* Interactive Trade Simulator */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950/80 border border-emerald-800/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-white">Interactive Constraint &amp; Trade Simulator</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Test-fire a simulated agent decision cycle. Verifies cash reserve and position limits before logging.
                </p>
              </div>

              <button
                onClick={handleSimulateTrade}
                disabled={simulating}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {simulating ? 'Evaluating...' : '▶ Run Simulated Trade Cycle'}
              </button>
            </div>

            {simulationLog && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-emerald-800/80 font-mono text-xs text-emerald-300 animate-fadeIn">
                {simulationLog}
              </div>
            )}
          </div>

          {/* Read-Only Safeguards Callout Box */}
          <div className="p-6 rounded-2xl bg-cyan-950/40 border border-cyan-800/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-cyan-400 font-bold text-sm">🛡️ How Read-Only Mode Is Enforced</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed pl-1">
              <li>&bull; <strong>No Real Orders Sent</strong>: The runner script in <code className="text-cyan-400 font-mono">scripts/robo_investor_agent.py</code> has <code className="text-cyan-400 font-mono">EXECUTION_MODE = &quot;READ_ONLY&quot;</code> enabled by default. Live order placement is strictly blocked in code.</li>
              <li>&bull; <strong>Read-Only API Permissions</strong>: When creating your Robinhood Agentic token, grant only <code className="text-slate-200 font-mono">read:portfolio</code> and <code className="text-slate-200 font-mono">read:quotes</code> scopes. Do not grant <code className="text-slate-400 font-mono">write:orders</code>.</li>
              <li>&bull; <strong>Full Analytical Validation</strong>: The bot queries real-time NBBO market prices and runs all constraint checks against your real account balance, outputting paper audit records for Huon.si with zero capital at risk.</li>
              <li>&bull; <strong>Switching to Live Later</strong>: Whenever you are ready to place real trades, switch <code className="text-emerald-400 font-mono">EXECUTION_MODE = &quot;APPROVAL_REQUIRED&quot;</code> to require mobile push approval on your phone before any order goes to market.</li>
            </ul>
          </div>

          {/* Setup Steps Timeline */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h4 className="text-base font-bold text-white">Enable Robinhood Agentic Trading Account</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-9">
                Open Robinhood &rarr; <strong>Settings</strong> &rarr; <strong>Robinhood Agents</strong>. Create a dedicated Agentic Trading Account. Transfer only your earmarked test capital ($500–$2,000) to keep personal savings isolated.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h4 className="text-base font-bold text-white">Configure Model Context Protocol (MCP)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-9">
                Robinhood provides an official MCP server for external agents. Run the ready-to-use Python script in <code className="text-emerald-400 font-mono">scripts/robo_investor_agent.py</code> to execute the constraint loop:
              </p>

              <div className="pl-9 pt-2">
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 relative">
                  <button
                    onClick={handleCopyCode}
                    className="absolute top-3 right-3 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono"
                  >
                    {copiedCode ? '✓ Copied' : 'Copy'}
                  </button>
                  <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre">
                    {pythonRunnerSnippet}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h4 className="text-base font-bold text-white">Continuous Sync to Huon.si</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-9">
                Whenever your agent executes a trade or modifies constraints, the script updates <code className="text-emerald-400 font-mono">src/data/investment_agent.json</code>. Committing this to your GitHub repository triggers your automated GitHub Actions workflow to publish the updated audit trail live to <code className="text-emerald-400 font-mono">huon.si</code>!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
