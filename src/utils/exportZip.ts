import JSZip from 'jszip';
import projectsData from '../data/projects.json';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Root files
  zip.file(
    'README.md',
    `# Terminal Portfolio Hub

A high-speed developer portfolio and subdomain application hub built with **Astro**, **Tailwind CSS v4**, and **Vercel Edge**.

## Architecture
- Root Domain (\`yourdomain.com\`): Hosts the terminal portfolio hub.
- CNAME Subdomains (\`*.yourdomain.com\`): Host individual micro-applications (e.g. \`timer.yourdomain.com\` for Neon Pomodoro).

## Quickstart
\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment to Vercel
1. Push to GitHub: \`git push -u origin main\`
2. Import repo into Vercel.
3. Configure CNAME records in DNS pointing to \`cname.vercel-dns.com\`.
`
  );

  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'terminal-portfolio',
        type: 'module',
        version: '1.0.0',
        scripts: {
          dev: 'astro dev',
          start: 'astro dev',
          build: 'astro build',
          preview: 'astro preview',
        },
        dependencies: {
          astro: '^5.0.0',
          '@tailwindcss/vite': '^4.0.0',
          tailwindcss: '^4.0.0',
        },
      },
      null,
      2
    )
  );

  zip.file(
    'astro.config.mjs',
    `import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  vite: {
    plugins: [tailwind()]
  }
});
`
  );

  zip.file(
    'vercel.json',
    JSON.stringify(
      {
        framework: 'astro',
        cleanUrls: true,
      },
      null,
      2
    )
  );

  zip.file('.gitignore', 'node_modules/\ndist/\n.astro/\n.env\n.DS_Store\n');

  // src directory
  const src = zip.folder('src');

  // src/data/projects.json
  const data = src?.folder('data');
  data?.file('projects.json', JSON.stringify(projectsData, null, 2));

  // src/layouts/Layout.astro
  const layouts = src?.folder('layouts');
  layouts?.file(
    'Layout.astro',
    `---
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
    <!-- Scanline Overlay -->
    <div class="pointer-events-none fixed inset-0 z-50 opacity-30 mix-blend-screen scanline-effect" aria-hidden="true"></div>

    <slot />

    <style is:global>
      @import "tailwindcss";

      @theme {
        --color-terminal-bg: #0a0a0a;
        --color-terminal-green: #00ff41;
        --color-terminal-dim: #008f11;
        --color-terminal-amber: #ffb000;
        --color-terminal-cyan: #00e5ff;
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
</html>
`
  );

  // src/pages/index.astro
  const pages = src?.folder('pages');
  pages?.file(
    'index.astro',
    `---
import Layout from '../layouts/Layout.astro';
import projectsData from '../data/projects.json';

const lastLoginTime = new Date().toUTCString();
---

<Layout title="Terminal Portfolio Hub">
  <main class="max-w-6xl mx-auto px-4 py-8 text-[#00ff41] font-mono">
    <!-- Top System Telemetry -->
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

    <!-- Simulated Terminal Command: cat about_me.txt -->
    <section class="border border-[#1a331c] bg-[#0e140e] p-5 mb-8">
      <div class="flex items-center gap-2 text-xs text-[#008f11] border-b border-[#1a331c] pb-2 mb-3">
        <span>guest@hub:~</span>
        <span class="text-[#00ff41] font-semibold">&gt;&gt; cat about_me.txt</span>
      </div>
      <div class="space-y-2 text-sm leading-relaxed text-[#c0ffc9]">
        <p>Full-stack systems engineer &amp; interface architect building high-speed edge applications, developer tooling, and distributed systems.</p>
        <p class="text-[#008f11] text-xs pt-1">
          CORE STACK: Astro · TypeScript · Tailwind CSS · Vercel Edge · Distributed Subdomain Routing
        </p>
      </div>
    </section>

    <!-- Applications Hub Grid -->
    <section class="space-y-4">
      <div class="flex items-center justify-between border-b border-[#1a331c] pb-2">
        <h2 class="text-sm font-semibold tracking-wider text-[#00ff41] uppercase flex items-center gap-2">
          <span>&gt;&gt;</span> APPLICATIONS [{projectsData.length}]
        </h2>
        <span class="text-xs text-[#008f11]">SOURCE: src/data/projects.json</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {projectsData.map((project) => (
          <article class="border border-[#1a331c] bg-[#0c120c] hover:border-[#00ff41] transition-colors p-4 flex flex-col justify-between group">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="text-base font-bold text-[#00ff41] group-hover:underline">
                  {project.name}
                </h3>
                <span class="text-[10px] text-[#008f11] font-mono uppercase">
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
                  <span>
                    {t}{idx < project.tech.length - 1 ? ' ·' : ''}
                  </span>
                ))}
              </div>

              <div class="flex items-center justify-between text-xs pt-1">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[#00ff41] hover:text-[#c0ffc9] flex items-center gap-1"
                >
                  <span>Launch</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[#008f11] hover:text-[#00ff41]"
                >
                  GitHub
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-12 pt-6 border-t border-[#1a331c] text-xs text-[#008f11] flex flex-col sm:flex-row items-center justify-between gap-2">
      <div>TERMINAL_PORTFOLIO_HUB // ASTRO + TAILWIND</div>
      <div>READY FOR VERCEL DEPLOYMENT</div>
    </footer>
  </main>
</Layout>
`
  );

  // Generate ZIP blob and trigger download
  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'terminal-portfolio-hub.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
