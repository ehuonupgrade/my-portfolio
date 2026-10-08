import React, { useState, useRef, useEffect } from 'react';
import { ProjectItem, TerminalTheme, CommandHistoryItem, PortfolioTab } from '../types';
import { playKeyClick, playBeep, playSuccessChime, playErrorBuzz } from '../utils/audio';

interface TerminalCLIProps {
  projects: ProjectItem[];
  theme: TerminalTheme;
  setTheme: (t: TerminalTheme) => void;
  scanlines: boolean;
  setScanlines: (s: boolean) => void;
  audioEnabled: boolean;
  setAudioEnabled: (a: boolean) => void;
  onLaunchProject: (project: ProjectItem) => void;
  onSelectTab: (tab: PortfolioTab) => void;
}

export const TerminalCLI: React.FC<TerminalCLIProps> = ({
  projects,
  theme,
  setTheme,
  scanlines,
  setScanlines,
  audioEnabled,
  setAudioEnabled,
  onLaunchProject,
  onSelectTab,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [commandList, setCommandList] = useState<string[]>([]);
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      command: 'sys.boot',
      timestamp: '00:00:01',
      output: (
        <div className="space-y-1 text-xs">
          <p className="text-opacity-80">TERMINAL_PORTFOLIO_HUB v3.8.0-RELEASE (x86_64-edge-linux)</p>
          <p className="opacity-75">All subdomains mapped via CNAME to Vercel Edge Network.</p>
          <p className="pt-1">Type <span className="font-bold underline">help</span> or <span className="font-bold underline">ls</span> to inspect workspace, or <span className="font-bold underline">cat about_me.txt</span>.</p>
        </div>
      ),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    playKeyClick();

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandList.length === 0) return;
      const nextIndex = historyIndex === null ? commandList.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandList[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandList.length) {
        setHistoryIndex(null);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandList[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion();
    }
  };

  const handleTabCompletion = () => {
    const raw = inputVal.trim();
    const available = [
      'help',
      'cat about_me.txt',
      'cat projects.json',
      'cat skills.md',
      'ls',
      'launch',
      'run pomodoro',
      'ping timer',
      'ping sql',
      'ping mind',
      'ping pulse',
      'subdomains',
      'theme green',
      'theme amber',
      'theme cyan',
      'theme white',
      'scanlines on',
      'scanlines off',
      'sound on',
      'sound off',
      'clear',
      'neofetch',
      'whoami',
      'date',
    ];

    const match = available.find((cmd) => cmd.startsWith(raw));
    if (match) {
      setInputVal(match);
      playBeep(440, 0.04);
    }
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCommandList((prev) => [...prev, trimmed]);
    setHistoryIndex(null);

    const parts = trimmed.split(/\s+/);
    const action = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    const newId = Math.random().toString(36).substring(2, 9);
    const timeStr = new Date().toTimeString().split(' ')[0];

    let outputNode: React.ReactNode = null;

    switch (action) {
      case 'clear':
      case 'cls':
        setHistory([]);
        setInputVal('');
        playSuccessChime();
        return;

      case 'help':
      case '?':
        playSuccessChime();
        outputNode = (
          <div className="space-y-2 text-xs">
            <p className="font-bold border-b border-current pb-1">AVAILABLE TERMINAL COMMANDS:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              <div><span className="font-semibold">cat about_me.txt</span> - Display developer profile &amp; bio</div>
              <div><span className="font-semibold">ls / dir</span> - List files and directories</div>
              <div><span className="font-semibold">cat projects.json</span> - Print project metadata array</div>
              <div><span className="font-semibold">launch &lt;app_id&gt;</span> - Open project interactive modal</div>
              <div><span className="font-semibold">run pomodoro</span> - Execute Neon Pomodoro focus timer</div>
              <div><span className="font-semibold">ping &lt;subdomain&gt;</span> - Ping subdomain endpoint (ICMP)</div>
              <div><span className="font-semibold">subdomains</span> - Inspect CNAME subdomain routing table</div>
              <div><span className="font-semibold">neofetch / sysinfo</span> - Display system architecture stats</div>
              <div><span className="font-semibold">theme &lt;color&gt;</span> - green | amber | cyan | white</div>
              <div><span className="font-semibold">scanlines &lt;on|off&gt;</span> - Toggle CRT scanlines</div>
              <div><span className="font-semibold">sound &lt;on|off&gt;</span> - Toggle terminal sound effects</div>
              <div><span className="font-semibold">whoami</span> - Print current authenticated identity</div>
              <div><span className="font-semibold">date</span> - Print system UTC timestamp</div>
              <div><span className="font-semibold">clear</span> - Clear terminal scrollback</div>
            </div>
          </div>
        );
        break;

      case 'cat': {
        const file = arg.toLowerCase();
        if (file === 'about_me.txt' || file === 'aboutme.txt') {
          playSuccessChime();
          outputNode = (
            <div className="space-y-3 text-xs leading-relaxed max-w-2xl">
              <p className="font-semibold text-sm">DEVELOPER PROFILE // GUEST_DEVELOPER</p>
              <p>
                Full-stack systems engineer &amp; interface architect building high-speed edge applications,
                developer tooling, and distributed systems.
              </p>
              <div className="border-l-2 border-current pl-3 space-y-1 text-opacity-90">
                <p>• Architecture: Edge-first micro-apps hosted on isolated subdomains (CNAME).</p>
                <p>• Primary Stack: Astro, React, TypeScript, Tailwind CSS v4, Vercel Edge.</p>
                <p>• Philosophy: Sub-50ms latency, zero layout shift, tactile terminal aesthetic.</p>
                <p>• Contact: Available for senior full-stack roles, consulting, and system design.</p>
              </div>
            </div>
          );
        } else if (file === 'projects.json' || file === 'src/data/projects.json') {
          playSuccessChime();
          outputNode = (
            <pre className="text-[11px] overflow-x-auto p-2 bg-black/40 border border-current border-opacity-30">
              {JSON.stringify(projects, null, 2)}
            </pre>
          );
        } else if (file === 'skills.md') {
          playSuccessChime();
          outputNode = (
            <div className="space-y-2 text-xs">
              <p className="font-bold">ENGINEERING CAPABILITIES:</p>
              <p>Languages: TypeScript, JavaScript, Rust, SQL, Python, GLSL</p>
              <p>Frameworks: Astro, React 19, Next.js, Vite, Tailwind CSS v4</p>
              <p>Infrastructure: Vercel, Cloudflare Workers, Docker, Linux, CNAME DNS</p>
              <p>AI / ML: Gemini API, Vector Embeddings, LLM Tools, WebAssembly</p>
            </div>
          );
        } else if (file === 'subdomains.conf') {
          playSuccessChime();
          outputNode = (
            <div className="space-y-1 text-xs">
              <p className="font-bold">SUBDOMAIN CNAME ROUTING TABLE:</p>
              {projects.map((p) => (
                <div key={p.id} className="flex gap-4">
                  <span className="w-48 font-mono">{p.subdomain}</span>
                  <span className="opacity-70">CNAME &rarr; cname.vercel-dns.com</span>
                  <span className="opacity-80">[{p.status}]</span>
                </div>
              ))}
            </div>
          );
        } else if (!file) {
          playErrorBuzz();
          outputNode = <p className="text-red-400 text-xs">cat: missing file argument. Try: cat about_me.txt</p>;
        } else {
          playErrorBuzz();
          outputNode = <p className="text-red-400 text-xs">cat: {file}: No such file or directory</p>;
        }
        break;
      }

      case 'ls':
      case 'dir':
        playSuccessChime();
        outputNode = (
          <div className="text-xs space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <span className="text-opacity-80">📄 about_me.txt</span>
              <span className="text-opacity-80">📄 projects.json</span>
              <span className="text-opacity-80">📄 skills.md</span>
              <span className="text-opacity-80">📄 subdomains.conf</span>
              <span className="text-opacity-80">📄 vercel.json</span>
              <span className="text-opacity-80">📁 src/layouts/</span>
              <span className="text-opacity-80">📁 src/pages/</span>
              <span className="text-opacity-80">📁 src/data/</span>
            </div>
            <p className="text-[11px] opacity-70">Total: 8 entries. Use &apos;cat &lt;file&gt;&apos; to read.</p>
          </div>
        );
        break;

      case 'launch':
      case 'open': {
        const query = arg.toLowerCase();
        const found = projects.find(
          (p) =>
            p.id.toLowerCase().includes(query) ||
            p.name.toLowerCase().includes(query) ||
            p.subdomain.toLowerCase().includes(query)
        );
        if (found) {
          playSuccessChime();
          onLaunchProject(found);
          outputNode = (
            <p className="text-xs">
              Opening application sandbox: <span className="font-bold">{found.name}</span> ({found.subdomain})...
            </p>
          );
        } else {
          playErrorBuzz();
          outputNode = (
            <p className="text-red-400 text-xs">
              App not found: &apos;{arg}&apos;. Available: {projects.map((p) => p.id).join(', ')}
            </p>
          );
        }
        break;
      }

      case 'run': {
        const query = arg.toLowerCase();
        if (query.includes('pomodoro') || query.includes('timer')) {
          const pomodoro = projects.find((p) => p.demoType === 'pomodoro') || projects[0];
          playSuccessChime();
          onLaunchProject(pomodoro);
          outputNode = (
            <p className="text-xs">
              Executing Neon Pomodoro focus timer subsystem...
            </p>
          );
        } else {
          const found = projects.find((p) => p.id.includes(query) || p.name.toLowerCase().includes(query));
          if (found) {
            playSuccessChime();
            onLaunchProject(found);
            outputNode = <p className="text-xs">Executing {found.name}...</p>;
          } else {
            playErrorBuzz();
            outputNode = <p className="text-red-400 text-xs">Usage: run pomodoro | run sql | run vector</p>;
          }
        }
        break;
      }

      case 'ping': {
        const target = arg.trim() || 'timer.yourdomain.com';
        playBeep(600, 0.05);
        outputNode = (
          <div className="space-y-1 text-xs font-mono">
            <p>PING {target} (76.76.21.21): 56 data bytes</p>
            <p>64 bytes from 76.76.21.21: icmp_seq=0 ttl=58 time=14.2 ms</p>
            <p>64 bytes from 76.76.21.21: icmp_seq=1 ttl=58 time=12.8 ms</p>
            <p>64 bytes from 76.76.21.21: icmp_seq=2 ttl=58 time=13.5 ms</p>
            <p>64 bytes from 76.76.21.21: icmp_seq=3 ttl=58 time=13.1 ms</p>
            <p className="opacity-80 pt-1">--- {target} ping statistics ---</p>
            <p className="opacity-80">4 packets transmitted, 4 received, 0% packet loss, rtt min/avg/max = 12.8/13.4/14.2 ms</p>
          </div>
        );
        break;
      }

      case 'subdomains':
        playSuccessChime();
        onSelectTab('subdomains');
        outputNode = (
          <div className="space-y-2 text-xs">
            <p className="font-bold">ACTIVE SUBDOMAIN MAPPINGS [{projects.length}]:</p>
            <div className="space-y-1 border-t border-current pt-1">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span>{p.subdomain}</span>
                  <span className="opacity-70">&rarr; {p.name} ({p.latency})</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] opacity-75 pt-1">Navigating to Subdomain Matrix tab...</p>
          </div>
        );
        break;

      case 'neofetch':
      case 'sysinfo':
        playSuccessChime();
        outputNode = (
          <div className="flex flex-col sm:flex-row gap-4 text-xs font-mono">
            <div className="text-opacity-80 whitespace-pre leading-tight">
{`   _____               _           _ 
  |_   _|__ _ _ _ __ (_) _ _  __ _| |
    | |/ -_) '_| '  \\| | ' \\/ _\` | |
    |_|\\___|_| |_|_|_|_|_||_\\__,_|_|
   ==================================
   [TERMINAL PORTFOLIO HUB]`}
            </div>
            <div className="space-y-1">
              <p><span className="font-semibold">OS:</span> Astro-OS / Vercel Edge Runtime</p>
              <p><span className="font-semibold">Host:</span> terminal-portfolio-hub</p>
              <p><span className="font-semibold">Kernel:</span> Edge-v4.3-Tailwind</p>
              <p><span className="font-semibold">Shell:</span> TermHub v3.8.0</p>
              <p><span className="font-semibold">Uptime:</span> 99.98% (High Availability)</p>
              <p><span className="font-semibold">Subdomains:</span> {projects.length} online</p>
              <p><span className="font-semibold">Theme:</span> {theme.toUpperCase()} phosphor</p>
            </div>
          </div>
        );
        break;

      case 'theme': {
        const chosen = arg.toLowerCase();
        if (['green', 'amber', 'cyan', 'white'].includes(chosen)) {
          setTheme(chosen as TerminalTheme);
          playSuccessChime();
          outputNode = <p className="text-xs">Terminal theme updated to {chosen.toUpperCase()}.</p>;
        } else {
          playErrorBuzz();
          outputNode = <p className="text-red-400 text-xs">Usage: theme &lt;green|amber|cyan|white&gt;</p>;
        }
        break;
      }

      case 'scanlines': {
        const val = arg.toLowerCase();
        if (val === 'on' || val === '1' || val === 'true') {
          setScanlines(true);
          playSuccessChime();
          outputNode = <p className="text-xs">CRT scanlines enabled.</p>;
        } else if (val === 'off' || val === '0' || val === 'false') {
          setScanlines(false);
          playSuccessChime();
          outputNode = <p className="text-xs">CRT scanlines disabled.</p>;
        } else {
          setScanlines(!scanlines);
          outputNode = <p className="text-xs">Scanlines toggled: {!scanlines ? 'ON' : 'OFF'}</p>;
        }
        break;
      }

      case 'sound':
      case 'audio': {
        const val = arg.toLowerCase();
        if (val === 'on' || val === '1') {
          setAudioEnabled(true);
          playSuccessChime();
          outputNode = <p className="text-xs">Terminal sound effects enabled.</p>;
        } else if (val === 'off' || val === '0') {
          setAudioEnabled(false);
          outputNode = <p className="text-xs">Terminal sound effects muted.</p>;
        } else {
          setAudioEnabled(!audioEnabled);
          outputNode = <p className="text-xs">Sound toggled: {!audioEnabled ? 'ON' : 'OFF'}</p>;
        }
        break;
      }

      case 'whoami':
        playSuccessChime();
        outputNode = (
          <div className="text-xs space-y-1">
            <p>USER: GUEST_DEVELOPER</p>
            <p>ROLE: Evaluator / Visitor</p>
            <p>PERMISSIONS: read, execute, inspect, cname-preview</p>
          </div>
        );
        break;

      case 'date':
        outputNode = <p className="text-xs">{new Date().toUTCString()}</p>;
        break;

      case 'echo':
        outputNode = <p className="text-xs">{arg}</p>;
        break;

      default:
        playErrorBuzz();
        outputNode = (
          <div className="text-xs space-y-1">
            <p className="text-red-400">command not found: {trimmed}</p>
            <p className="opacity-70">Type <span className="font-bold underline cursor-pointer" onClick={() => executeCommand('help')}>help</span> for list of recognized commands.</p>
          </div>
        );
        break;
    }

    setHistory((prev) => [
      ...prev,
      {
        id: newId,
        command: trimmed,
        timestamp: timeStr,
        output: outputNode,
      },
    ]);
    setInputVal('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(inputVal);
  };

  return (
    <div
      onClick={focusInput}
      className="bg-[#0b100b] border border-[#1a331c] rounded-none p-4 font-mono text-inherit text-xs sm:text-sm flex flex-col h-[420px] transition-all cursor-text shadow-inner"
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-[#1a331c] pb-2 mb-3 text-[11px] opacity-75 select-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-red-500/60 rounded-full"></span>
          <span className="inline-block w-2.5 h-2.5 bg-yellow-500/60 rounded-full"></span>
          <span className="inline-block w-2.5 h-2.5 bg-green-500/60 rounded-full"></span>
          <span className="ml-2 font-semibold">guest@terminal-hub: ~ (pts/0)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>TAB to autocomplete</span>
          <span>&uarr;&darr; history</span>
        </div>
      </div>

      {/* Terminal Scrollback Output */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {history.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center gap-2 opacity-80 text-xs">
              <span className="opacity-50">[{item.timestamp}]</span>
              <span className="font-bold">$</span>
              <span className="font-semibold">{item.command}</span>
            </div>
            <div className="pl-4">{item.output}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Command Prompt Input */}
      <form onSubmit={handleFormSubmit} className="mt-2 pt-2 border-t border-[#1a331c] flex items-center gap-2">
        <span className="font-bold select-none text-xs sm:text-sm shrink-0">
          guest@hub:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type 'help', 'cat about_me.txt', or 'run pomodoro'..."
          className="flex-1 bg-transparent border-none outline-none text-inherit placeholder:opacity-30 text-xs sm:text-sm font-mono caret-current"
          autoFocus
        />
        <span className="cursor-blink font-bold select-none text-base leading-none">█</span>
      </form>
    </div>
  );
};
