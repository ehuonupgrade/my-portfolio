import React, { useState } from 'react';
import { ProjectItem } from '../types';
import { playKeyClick, playSuccessChime } from '../utils/audio';
import { downloadProjectZip } from '../utils/exportZip';

interface AstroSpecViewerProps {
  projects: ProjectItem[];
  accentColorClass: string;
}

export const AstroSpecViewer: React.FC<AstroSpecViewerProps> = ({
  projects,
  accentColorClass,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('projects.json');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);

  const handleDownloadFullZip = async () => {
    playKeyClick();
    setDownloadingZip(true);
    try {
      await downloadProjectZip();
      playSuccessChime();
    } catch {
      // ignore
    } finally {
      setDownloadingZip(false);
    }
  };

  const fileContents: Record<string, string> = {
    'projects.json': JSON.stringify(projects, null, 2),
    'Layout.astro': `---
interface Props {
  title?: string;
  description?: string;
}

const {
  title = "Terminal Portfolio Hub",
  description = "A high-speed developer portfolio and subdomain application hub."
} = Astro.props;
---

<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-[#0a0a0a] text-[#00ff41] antialiased selection:bg-[#00ff41] selection:text-[#0a0a0a] min-h-screen relative font-mono">
    <!-- Global Scanline Overlay -->
    <div class="pointer-events-none fixed inset-0 z-50 opacity-30 mix-blend-screen scanline-effect" aria-hidden="true"></div>

    <slot />

    <style is:global>
      @import "tailwindcss";

      @theme {
        --color-terminal-bg: #0a0a0a;
        --color-terminal-green: #00ff41;
        --color-terminal-dim: #008f11;
        --font-mono: 'JetBrains Mono', monospace;
      }

      .scanline-effect {
        background: linear-gradient(
          rgba(18, 16, 16, 0) 50%,
          rgba(0, 0, 0, 0.45) 50%
        ),
        linear-gradient(
          90deg,
          rgba(0, 255, 65, 0.02),
          rgba(0, 255, 65, 0.01),
          rgba(0, 255, 65, 0.02)
        );
        background-size: 100% 3px, 6px 100%;
      }
    </style>
  </body>
</html>`,
    'index.astro': `---
import Layout from '../layouts/Layout.astro';
import projectsData from '../data/projects.json';

const lastLoginTime = new Date().toUTCString();
---

<Layout title="Terminal Portfolio Hub">
  <main class="max-w-6xl mx-auto px-4 py-8 text-[#00ff41] font-mono">
    <!-- Header Section -->
    <header class="border-b border-[#1a331c] pb-6 mb-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between text-xs text-[#008f11] mb-2 gap-1">
        <span>HOST: hub.terminal.internal</span>
        <span>LAST_LOGIN: {lastLoginTime}</span>
        <span>TTY: pts/0</span>
      </div>
      <div class="text-xl md:text-2xl font-bold tracking-tight text-[#00ff41] flex items-center gap-2">
        <span class="text-[#008f11]">$</span>
        <span>USER_IDENT: GUEST_DEVELOPER</span>
        <span class="inline-block w-2.5 h-5 bg-[#00ff41] animate-pulse"></span>
      </div>
    </header>

    <!-- Simulated Terminal Command -->
    <section class="border border-[#1a331c] bg-[#0e140e] p-5 mb-8">
      <div class="flex items-center gap-2 text-xs text-[#008f11] border-b border-[#1a331c] pb-2 mb-3">
        <span>guest@hub:~</span>
        <span class="text-[#00ff41] font-semibold">&gt;&gt; cat about_me.txt</span>
      </div>
      <div class="space-y-2 text-sm leading-relaxed text-[#c0ffc9]">
        <p>Full-stack systems engineer &amp; interface architect building high-speed edge applications.</p>
        <p class="text-[#008f11] text-xs pt-1">
          CORE STACK: Astro · TypeScript · Tailwind CSS · Vercel Edge · Distributed Subdomain Routing
        </p>
      </div>
    </section>

    <!-- Applications Grid -->
    <section class="space-y-4">
      <div class="flex items-center justify-between border-b border-[#1a331c] pb-2">
        <h2 class="text-sm font-semibold tracking-wider text-[#00ff41] uppercase">
          &gt;&gt; APPLICATIONS [{projectsData.length}]
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {projectsData.map((project) => (
          <article class="border border-[#1a331c] bg-[#0c120c] hover:border-[#00ff41] transition-colors p-4 flex flex-col justify-between group">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="text-base font-bold text-[#00ff41] group-hover:underline">
                  {project.name}
                </h3>
                <span class="text-[10px] text-[#008f11] font-mono">
                  {project.status || "ONLINE"}
                </span>
              </div>
              <p class="text-xs text-[#8cb08f] leading-relaxed mb-4">
                {project.description}
              </p>
            </div>

            <div class="space-y-3 pt-2 border-t border-[#142616]">
              <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-[#008f11]">
                {project.tech.map((t, idx) => (
                  <span>{t}{idx < project.tech.length - 1 ? ' ·' : ''}</span>
                ))}
              </div>
              <div class="flex items-center justify-between text-xs pt-1">
                <a href={project.url} target="_blank" rel="noopener noreferrer" class="text-[#00ff41] hover:underline">
                  Launch &rarr;
                </a>
                <a href={project.github} target="_blank" rel="noopener noreferrer" class="text-[#008f11] hover:text-[#00ff41]">
                  GitHub
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  </main>
</Layout>`,
    'astro.config.mjs': `import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  vite: {
    plugins: [tailwind()]
  }
});`,
    'vercel.json': `{
  "framework": "astro",
  "cleanUrls": true
}`,
  };

  const handleCopy = () => {
    playKeyClick();
    const content = fileContents[selectedFile] || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    playSuccessChime();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    playKeyClick();
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    URL.revokeObjectURL(url);
    playSuccessChime();
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="border border-[#1a331c] bg-[#0c120c] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-base font-bold ${accentColorClass}`}>
            ASTRO + TAILWIND V4 + VERCEL CODE SPECIFICATION
          </h2>
          <p className="text-xs opacity-75 mt-1 max-w-xl leading-relaxed">
            The exact code seeds requested by the project specification are maintained in the codebase.
            You can copy or inspect each source file below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadFullZip}
            disabled={downloadingZip}
            className="px-3.5 py-1.5 bg-[#00ff41] text-[#0a0a0a] text-xs font-bold hover:bg-[#52ff7d] transition-colors"
          >
            {downloadingZip ? 'PACKING...' : 'Download Full Project (.ZIP)'}
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 border border-[#1a3d1e] hover:border-[#00ff41] text-xs font-mono transition-colors"
          >
            {copied ? '✓ COPIED' : 'Copy File Content'}
          </button>
        </div>
      </div>

      {/* File Tabs & Code Inspector */}
      <div className="border border-[#1a331c] bg-[#0a100a]">
        <div className="flex flex-wrap items-center gap-1 border-b border-[#1a331c] bg-[#070d07] px-3 pt-2 text-xs font-mono">
          {Object.keys(fileContents).map((fileName) => (
            <button
              key={fileName}
              onClick={() => {
                playKeyClick();
                setSelectedFile(fileName);
              }}
              className={`px-3 py-1.5 border-t border-x transition-colors ${
                selectedFile === fileName
                  ? 'border-[#1a3d1e] bg-[#0a100a] text-[#00ff41] font-bold'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {fileName}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-x-auto">
          <pre className="text-xs font-mono leading-relaxed text-[#c0ffc9]">
            {fileContents[selectedFile]}
          </pre>
        </div>
      </div>

      {/* Deployment & GitHub Push Guide */}
      <div className="border border-[#1a331c] bg-[#0b100b] p-5 space-y-4 text-xs leading-relaxed">
        <h3 className="font-bold text-[#00ff41]">
          HOW TO PUBLISH TO GITHUB &amp; DEPLOY TO VERCEL
        </h3>

        <div className="space-y-3 opacity-90">
          <div className="p-3 bg-[#080e08] border border-[#142616] space-y-1">
            <p className="font-semibold text-[#00ff41]">Option 1: Direct 1-Click ZIP Download (Recommended)</p>
            <p>Click the green <span className="font-bold text-white bg-[#142616] px-1.5 py-0.5 border border-[#1a3d1e]">DOWNLOAD .ZIP</span> button in the top navigation bar. Extract the folder to your machine, then run:</p>
            <pre className="p-2 bg-black/60 text-[#00ff41] overflow-x-auto select-all">
git init
git add .
git commit -m "feat: initial terminal portfolio commit"
git remote add origin https://github.com/&lt;your-username&gt;/terminal-portfolio.git
git push -u origin main
            </pre>
          </div>

          <div className="p-3 bg-[#080e08] border border-[#142616] space-y-1">
            <p className="font-semibold text-[#00ff41]">Option 2: Google AI Studio UI Export</p>
            <p>If you don&apos;t see a GitHub icon directly in the Chrome header:</p>
            <p>• Look in the AI Studio top bar for the <span className="font-bold text-white">Share</span> or <span className="font-bold text-white">Export</span> button.</p>
            <p>• Or check the three dots menu (<span className="font-bold text-white">⋮</span>) in the top-right of the AI Studio window.</p>
            <p>• Depending on your browser zoom and screen width, header buttons collapse into the overflow menu.</p>
          </div>

          <div className="p-3 bg-[#080e08] border border-[#142616] space-y-1">
            <p className="font-semibold text-[#00ff41]">Option 3: Connect to Vercel</p>
            <p>Once pushed to GitHub, go to <span className="font-bold text-white">vercel.com &rarr; Add New Project &rarr; Import Git Repository</span>. Vercel automatically detects the Astro build configuration and deploys your root portfolio and CNAME subdomains.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
