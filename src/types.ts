export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  url: string;
  subdomain: string;
  github: string;
  tech: string[];
  status: 'ONLINE' | 'STANDBY' | 'MAINTENANCE';
  latency: string;
  category: string;
  version: string;
  demoType: 'pomodoro' | 'sql' | 'vector' | 'telemetry' | 'shader' | 'vault';
}

export type TerminalTheme = 'green' | 'amber' | 'cyan' | 'white';

export type PortfolioTab = 'projects' | 'games' | 'about' | 'cli' | 'subdomains' | 'astro';

export interface CommandHistoryItem {
  id: string;
  command: string;
  output: React.ReactNode;
  timestamp: string;
}

export interface SubdomainRecord {
  subdomain: string;
  target: string;
  recordType: 'CNAME' | 'A';
  status: 'PROXIED' | 'ACTIVE' | 'PENDING';
  ssl: 'VALID' | 'PROVISIONING';
  appName: string;
}
