import React, { useState, useEffect } from 'react';
import { ProjectItem } from '../types';
import { playBeep, playKeyClick, playSuccessChime } from '../utils/audio';

interface AppSandboxModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  accentColorClass: string;
}

export const AppSandboxModal: React.FC<AppSandboxModalProps> = ({
  project,
  onClose,
  accentColorClass,
}) => {
  // Tabs: 'sandbox' | 'architecture' | 'spec'
  const [activeTab, setActiveTab] = useState<'sandbox' | 'architecture' | 'spec'>('sandbox');

  // Pomodoro State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [taskName, setTaskName] = useState('Deep Work: Subdomain Hub Architecture');
  const [focusTips, setFocusTips] = useState<string>('Keep friction at zero. Terminal state loaded.');

  // SQL State
  const [sqlQuery, setSqlQuery] = useState("SELECT app_name, subdomain, latency_ms FROM subdomains WHERE status = 'ONLINE';");
  const [sqlResults, setSqlResults] = useState<Array<Record<string, string | number>>>([
    { app_name: 'Neon Pomodoro', subdomain: 'timer.yourdomain.com', latency_ms: 14 },
    { app_name: 'CyberQuery SQL', subdomain: 'sql.yourdomain.com', latency_ms: 18 },
    { app_name: 'VectorMind', subdomain: 'mind.yourdomain.com', latency_ms: 24 },
    { app_name: 'DevPulse', subdomain: 'pulse.yourdomain.com', latency_ms: 9 },
  ]);
  const [sqlExecTime, setSqlExecTime] = useState('0.38ms');

  // Vector Search State
  const [vectorQuery, setVectorQuery] = useState('edge routing');
  const [vectorMatches, setVectorMatches] = useState<Array<{ text: string; score: number }>>([
    { text: 'Astro root domain dynamic routing with CNAME delegation', score: 0.94 },
    { text: 'Vercel Edge middleware rewrite rules for multi-tenant subdomains', score: 0.89 },
    { text: 'Zero layout shift terminal layout with CSS scanlines', score: 0.82 },
  ]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Pomodoro Timer Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            playSuccessChime();
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, pomodoroSeconds]);

  if (!project) return null;

  const toggleTimer = () => {
    playBeep(isTimerRunning ? 440 : 880, 0.08);
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = (mode: 'focus' | 'break') => {
    playKeyClick();
    setIsTimerRunning(false);
    setTimerMode(mode);
    setPomodoroSeconds(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const generateGeminiFocusTip = () => {
    playBeep(650, 0.06);
    const tips = [
      'Break high-complexity algorithms into 3 verifiable invariants before writing code.',
      'Silence background noise. Isolate terminal focus for the next 25-minute cycle.',
      'Ensure subdomains decouple concerns: single purpose per edge deployment.',
      'Draft state mutations on paper; code flows faster when model is crystallized.',
    ];
    const picked = tips[Math.floor(Math.random() * tips.length)];
    setFocusTips(picked);
  };

  const executeSqlQuery = () => {
    playKeyClick();
    playBeep(620, 0.04);
    const q = sqlQuery.toLowerCase();
    setSqlExecTime((0.15 + Math.random() * 0.4).toFixed(2) + 'ms');
    if (q.includes('devpulse') || q.includes('pulse')) {
      setSqlResults([
        { app_name: 'DevPulse', subdomain: 'pulse.yourdomain.com', latency_ms: 9, status: 'ONLINE' },
      ]);
    } else {
      setSqlResults([
        { app_name: 'Neon Pomodoro', subdomain: 'timer.yourdomain.com', latency_ms: 14, status: 'ONLINE' },
        { app_name: 'CyberQuery SQL', subdomain: 'sql.yourdomain.com', latency_ms: 18, status: 'ONLINE' },
        { app_name: 'VectorMind', subdomain: 'mind.yourdomain.com', latency_ms: 24, status: 'ONLINE' },
        { app_name: 'DevPulse', subdomain: 'pulse.yourdomain.com', latency_ms: 9, status: 'ONLINE' },
      ]);
    }
  };

  const executeVectorSearch = (e: React.FormEvent) => {
    e.preventDefault();
    playBeep(750, 0.04);
    const term = vectorQuery.toLowerCase();
    const corpus = [
      { text: 'Astro root domain dynamic routing with CNAME delegation', score: 0.94 },
      { text: 'Vercel Edge middleware rewrite rules for multi-tenant subdomains', score: 0.89 },
      { text: 'Neon Pomodoro: Cyberpunk focus sessions with Web Audio ticks', score: 0.86 },
      { text: 'Zero layout shift terminal layout with CSS scanlines & phosphor glow', score: 0.82 },
      { text: 'Encrypted client-side storage using WebCrypto & passkeys', score: 0.77 },
    ];
    const filtered = corpus
      .map((item) => ({
        ...item,
        score: Number((0.55 + Math.random() * 0.4).toFixed(2)),
      }))
      .sort((a, b) => b.score - a.score);
    setVectorMatches(filtered);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#0b100b] border-2 border-[#1a3d1e] w-full max-w-4xl max-h-[92vh] flex flex-col font-mono text-inherit shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1a3d1e] p-4 bg-[#070c07]">
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-60">APP_RUNNER //</span>
            <h2 className={`text-base sm:text-lg font-bold tracking-tight ${accentColorClass}`}>
              {project.name}
            </h2>
            <span className="text-xs opacity-60 hidden sm:inline">[{project.subdomain}]</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs opacity-80 hover:opacity-100 hover:underline hidden sm:inline"
            >
              Open External &rarr;
            </a>
            <button
              onClick={() => {
                playKeyClick();
                onClose();
              }}
              className="px-2.5 py-1 bg-[#142616] hover:bg-[#00ff41] hover:text-[#0a0a0a] transition-colors text-xs font-bold border border-[#1a3d1e]"
              title="Close (Esc)"
            >
              &times; ESC
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 border-b border-[#1a3d1e] px-4 py-2 bg-[#0d140d] text-xs">
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('sandbox');
            }}
            className={`px-3 py-1 transition-colors border-b-2 ${
              activeTab === 'sandbox'
                ? 'border-[#00ff41] font-bold text-[#00ff41]'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            Live Sandbox
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('architecture');
            }}
            className={`px-3 py-1 transition-colors border-b-2 ${
              activeTab === 'architecture'
                ? 'border-[#00ff41] font-bold text-[#00ff41]'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            CNAME Subdomain Architecture
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('spec');
            }}
            className={`px-3 py-1 transition-colors border-b-2 ${
              activeTab === 'spec'
                ? 'border-[#00ff41] font-bold text-[#00ff41]'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            Astro Integration Spec
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'sandbox' && (
            <div>
              {/* If Neon Pomodoro */}
              {project.demoType === 'pomodoro' && (
                <div className="space-y-6">
                  {/* Neon Pomodoro Focus Timer Display */}
                  <div className="border border-[#1a3d1e] bg-[#070d07] p-6 text-center space-y-4">
                    <div className="flex items-center justify-between text-xs opacity-70 border-b border-[#142616] pb-2">
                      <span>CYBERPUNK FOCUS ENGINE v1.4</span>
                      <span>STATUS: {isTimerRunning ? 'ACTIVE FLOW' : 'PAUSED'}</span>
                    </div>

                    <div className="py-2">
                      <div className="text-6xl sm:text-7xl font-bold tracking-widest text-[#00ff41] font-mono glow-green">
                        {formatTimer(pomodoroSeconds)}
                      </div>
                      <p className="text-xs opacity-60 mt-1 uppercase tracking-widest">
                        {timerMode === 'focus' ? 'Session: Deep Focus (25m)' : 'Session: Cyber Recovery (5m)'}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#111e13] h-2 overflow-hidden border border-[#1a3d1e]">
                      <div
                        className="bg-[#00ff41] h-full transition-all duration-1000"
                        style={{
                          width: `${(pomodoroSeconds / (timerMode === 'focus' ? 25 * 60 : 5 * 60)) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={toggleTimer}
                        className={`px-6 py-2.5 font-bold text-sm tracking-wider uppercase transition-colors border ${
                          isTimerRunning
                            ? 'bg-[#2a1111] border-red-500 text-red-300 hover:bg-red-500 hover:text-black'
                            : 'bg-[#00ff41] text-[#0a0a0a] border-[#00ff41] hover:bg-[#52ff7d]'
                        }`}
                      >
                        {isTimerRunning ? 'Pause Session' : 'Start Focus'}
                      </button>

                      <button
                        onClick={() => resetTimer('focus')}
                        className="px-4 py-2 text-xs border border-[#1a3d1e] bg-[#0e170e] hover:border-[#00ff41] transition-colors"
                      >
                        Reset 25m
                      </button>

                      <button
                        onClick={() => resetTimer('break')}
                        className="px-4 py-2 text-xs border border-[#1a3d1e] bg-[#0e170e] hover:border-[#00ff41] transition-colors"
                      >
                        Short Break 5m
                      </button>
                    </div>

                    {/* Task Tracker Input */}
                    <div className="pt-4 border-t border-[#142616] text-left">
                      <label className="text-xs opacity-70 block mb-1">CURRENT OBJECTIVE:</label>
                      <input
                        type="text"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        className="w-full bg-[#0d170d] border border-[#1a3d1e] p-2 text-xs text-[#00ff41] outline-none focus:border-[#00ff41]"
                      />
                    </div>
                  </div>

                  {/* Gemini API Cyber Focus Suggestions */}
                  <div className="border border-[#1a3d1e] bg-[#080e08] p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#00ff41] flex items-center gap-1.5">
                        <span>&gt;</span> Gemini API Focus Protocol
                      </span>
                      <button
                        onClick={generateGeminiFocusTip}
                        className="opacity-70 hover:opacity-100 hover:underline text-xs"
                      >
                        [Generate Protocol]
                      </button>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed italic border-l-2 border-[#00ff41] pl-3 py-1">
                      &quot;{focusTips}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* If CyberQuery SQL */}
              {project.demoType === 'sql' && (
                <div className="space-y-4">
                  <div className="border border-[#1a3d1e] bg-[#070d07] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs opacity-70 border-b border-[#142616] pb-2">
                      <span>SQL ENGINE QUERY CONSOLE (WASM SQLITE)</span>
                      <span>TIME: {sqlExecTime}</span>
                    </div>

                    <div>
                      <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        rows={3}
                        className="w-full bg-[#0c140c] border border-[#1a3d1e] p-3 text-xs font-mono text-[#00ff41] outline-none focus:border-[#00ff41]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] opacity-60">Schema: subdomains (id, app_name, subdomain, latency_ms, status)</span>
                      <button
                        onClick={executeSqlQuery}
                        className="px-4 py-1.5 bg-[#00ff41] text-[#0a0a0a] text-xs font-bold hover:bg-[#52ff7d] transition-colors"
                      >
                        Execute SQL
                      </button>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="border border-[#1a3d1e] bg-[#0a100a] overflow-x-auto">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-[#101c12] border-b border-[#1a3d1e] text-[11px] opacity-80">
                        <tr>
                          {Object.keys(sqlResults[0] || {}).map((col) => (
                            <th key={col} className="p-2.5 font-bold uppercase">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#142616]">
                        {sqlResults.map((row, i) => (
                          <tr key={i} className="hover:bg-[#0e1a10]">
                            {Object.values(row).map((val, idx) => (
                              <td key={idx} className="p-2.5">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* If VectorMind */}
              {project.demoType === 'vector' && (
                <div className="space-y-4">
                  <div className="border border-[#1a3d1e] bg-[#070d07] p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs opacity-70 border-b border-[#142616] pb-2">
                      <span>SEMANTIC VECTOR SEARCH EMBEDDINGS</span>
                      <span>DIMENSIONS: 768-D</span>
                    </div>

                    <form onSubmit={executeVectorSearch} className="flex gap-2">
                      <input
                        type="text"
                        value={vectorQuery}
                        onChange={(e) => setVectorQuery(e.target.value)}
                        placeholder="Search semantic documents..."
                        className="flex-1 bg-[#0c140c] border border-[#1a3d1e] p-2 text-xs text-[#00ff41] outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#00ff41] text-[#0a0a0a] text-xs font-bold hover:bg-[#52ff7d]"
                      >
                        Search
                      </button>
                    </form>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs opacity-70">TOP MATCHES (COSINE SIMILARITY):</p>
                    {vectorMatches.map((m, idx) => (
                      <div key={idx} className="border border-[#1a3d1e] bg-[#090f09] p-3 text-xs flex items-center justify-between gap-4">
                        <span className="opacity-90">{m.text}</span>
                        <span className="font-mono text-[#00ff41] shrink-0 font-bold">{(m.score * 100).toFixed(1)}% match</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default/Other apps */}
              {['telemetry', 'shader', 'vault'].includes(project.demoType || '') && (
                <div className="space-y-4 border border-[#1a3d1e] bg-[#070d07] p-6 text-center">
                  <div className="text-2xl font-bold tracking-tight text-[#00ff41]">
                    {project.name} Subsystem Initialized
                  </div>
                  <p className="text-xs opacity-80 max-w-lg mx-auto">
                    {project.description}
                  </p>
                  <div className="pt-4 flex justify-center gap-3">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#00ff41] text-[#0a0a0a] text-xs font-bold hover:bg-[#52ff7d]"
                    >
                      Visit {project.subdomain} &rarr;
                    </a>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-[#1a3d1e] text-xs hover:border-[#00ff41]"
                    >
                      View GitHub Repo
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="border border-[#1a3d1e] bg-[#080e08] p-5 space-y-4 text-xs">
                <h3 className="font-bold text-sm text-[#00ff41]">
                  DNS CNAME SUBDOMAIN SPECIFICATION
                </h3>
                <p className="opacity-80 leading-relaxed">
                  The portfolio acts as the centralized root hub (`yourdomain.com`). Each micro-application is deployed independently to Vercel or Cloudflare and bound to a dedicated CNAME record.
                </p>

                <div className="bg-black/60 p-3 border border-[#142616] space-y-2 font-mono">
                  <div className="text-[11px] opacity-60">DNS CONFIGURATION (BIND FORMAT):</div>
                  <div className="text-[#00ff41]">
                    {project.subdomain.split('.')[0]} IN CNAME cname.vercel-dns.com.
                  </div>
                  <div className="opacity-70 text-[11px]">
                    TTL: 300 (5 minutes) · Proxy Status: DNS Only or Proxied
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="font-semibold text-[#00ff41]">Deployment Verification Checklist:</p>
                  <div className="space-y-1 opacity-80">
                    <p>✓ Micro-app repository created &amp; pushed to GitHub.</p>
                    <p>✓ Vercel project imported and linked to `{project.subdomain}`.</p>
                    <p>✓ CNAME DNS record created at domain registrar / Cloudflare.</p>
                    <p>✓ SSL certificate automatically provisioned by Let&apos;s Encrypt / Vercel Edge.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spec' && (
            <div className="space-y-4 text-xs">
              <p className="opacity-80">
                Astro metadata configuration entry from `/src/data/projects.json`:
              </p>
              <pre className="p-4 bg-black/60 border border-[#1a3d1e] text-[11px] text-[#00ff41] overflow-x-auto">
{JSON.stringify(project, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#1a3d1e] p-3 bg-[#070c07] flex items-center justify-between text-xs opacity-70">
          <span>HOST: {project.subdomain}</span>
          <span>TECH: {project.tech.join(' · ')}</span>
        </div>
      </div>
    </div>
  );
};
