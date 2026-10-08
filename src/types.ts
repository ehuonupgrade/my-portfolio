export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  url: string;
  subdomain: string;
  github?: string;
  tech: string[];
  status: string;
  category: string;
  year?: string;
  version?: string;
  latency?: string;
  demoType?: string;
}

export type TerminalTheme = 'green' | 'amber' | 'cyan' | 'white';

export type PortfolioTab = 'projects' | 'games' | 'about' | 'cli' | 'subdomains';

export interface CommandHistoryItem {
  id: string;
  command: string;
  output: React.ReactNode;
  timestamp: string;
}
