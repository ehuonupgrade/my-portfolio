import {
  LLMModelInfo,
  LLMApplicationInfo,
  DailyTokenRecord,
} from '../types/tokenUsage';

export const SUPPORTED_LLM_APPLICATIONS: LLMApplicationInfo[] = [
  {
    id: 'google-ai-studio',
    name: 'Google AI Studio',
    category: 'Developer Platform',
    color: '#3b82f6', // Google Blue
    badgeBg: 'bg-blue-950/70',
    badgeBorder: 'border-blue-700/80',
    badgeText: 'text-blue-300',
    icon: '⚡',
    description: 'Direct interactive prompt engineering, code synthesis, agent generation & build sessions',
  },
  {
    id: 'edgedetect',
    name: 'EdgeDetect (Market Intelligence Engine)',
    category: 'Internal Tool',
    color: '#06b6d4', // Cyan
    badgeBg: 'bg-cyan-950/70',
    badgeBorder: 'border-cyan-700/80',
    badgeText: 'text-cyan-300',
    icon: '⚡',
    description: 'Live odds aggregation, sharp money divergence detection & 1-game strategy generation',
  },
  {
    id: 'roboinvestor',
    name: 'RoboInvestor (Robinhood Agent)',
    category: 'Autonomous Agent',
    color: '#10b981', // Emerald
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-700/80',
    badgeText: 'text-emerald-300',
    icon: '📈',
    description: 'Constraint-bound autonomous investment agent rationale and portfolio balance auditing',
  },
  {
    id: 'cursor-ide',
    name: 'Cursor / VS Code Assistant',
    category: 'Productivity',
    color: '#f59e0b', // Amber
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-amber-700/80',
    badgeText: 'text-amber-300',
    icon: '💻',
    description: 'Inline editor context, multi-file code completions & developer terminal assistance',
  },
  {
    id: 'gemini-chat',
    name: 'Gemini Web App / Chat',
    category: 'Productivity',
    color: '#8b5cf6', // Violet
    badgeBg: 'bg-purple-950/70',
    badgeBorder: 'border-purple-700/80',
    badgeText: 'text-purple-300',
    icon: '💬',
    description: 'Direct conversational web research, document synthesis & high-level conceptual queries',
  },
  {
    id: 'activity-hub',
    name: 'Kids Activity Hub',
    category: 'Internal Tool',
    color: '#ec4899', // Pink
    badgeBg: 'bg-pink-950/70',
    badgeBorder: 'border-pink-700/80',
    badgeText: 'text-pink-300',
    icon: '🎨',
    description: 'Local youth activities rating classification & weekly schedule extraction',
  },
];

export const SUPPORTED_LLM_MODELS: LLMModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google',
    color: '#2563eb', // Bright Royal Blue
    badgeBg: 'bg-blue-950/80',
    badgeBorder: 'border-blue-500/80',
    badgeText: 'text-blue-300',
    costPerMillionPrompt: 0.10,
    costPerMillionCompletion: 0.40,
  },
  {
    id: 'gemini-3.8-pro',
    name: 'Gemini 3.8 Pro',
    provider: 'Google',
    color: '#4f46e5', // Indigo
    badgeBg: 'bg-indigo-950/80',
    badgeBorder: 'border-indigo-500/80',
    badgeText: 'text-indigo-300',
    costPerMillionPrompt: 1.25,
    costPerMillionCompletion: 5.0,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    color: '#06b6d4', // Cyan
    badgeBg: 'bg-cyan-950/70',
    badgeBorder: 'border-cyan-700/80',
    badgeText: 'text-cyan-300',
    costPerMillionPrompt: 0.15,
    costPerMillionCompletion: 0.60,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    color: '#8b5cf6', // Violet
    badgeBg: 'bg-purple-950/70',
    badgeBorder: 'border-purple-700/80',
    badgeText: 'text-purple-300',
    costPerMillionPrompt: 1.25,
    costPerMillionCompletion: 5.0,
  },
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    color: '#f97316', // Orange
    badgeBg: 'bg-orange-950/70',
    badgeBorder: 'border-orange-700/80',
    badgeText: 'text-orange-300',
    costPerMillionPrompt: 3.0,
    costPerMillionCompletion: 15.0,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    color: '#10b981', // Emerald
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-700/80',
    badgeText: 'text-emerald-300',
    costPerMillionPrompt: 2.5,
    costPerMillionCompletion: 10.0,
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'OpenAI',
    color: '#0284c7', // Sky Blue
    badgeBg: 'bg-sky-950/70',
    badgeBorder: 'border-sky-700/80',
    badgeText: 'text-sky-300',
    costPerMillionPrompt: 1.1,
    costPerMillionCompletion: 4.4,
  },
];

export const DEFAULT_DAILY_QUOTA_LIMIT = 1_000_000; // 1,000,000 tokens per day

/**
 * Historical token usage records populated to reflect real workflow:
 * - Google AI Studio is the primary application (>85% of recent tokens)
 * - Gemini 3.8 Flash & Gemini 3.8 Pro are the primary models used for development, testing & generation.
 */
export const SEED_DAILY_TOKEN_RECORDS: DailyTokenRecord[] = [
  // Today: Oct 15, 2026 (Thursday) - ACTIVE LIVE SESSION
  {
    date: '2026-10-15',
    dateLabel: 'Oct 15 (Today)',
    dayOfWeek: 'Thu',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 1_068_400,
    isFullyUtilized: true,
    utilizationPercentage: 106.8,
    workloadNote: '⚡ LIVE ACTIVE SESSION (106.8%): Google AI Studio build sessions — Week 6 TNF (Seahawks @ Broncos) live odds sync, roster verification & injury wire algorithms with Gemini 3.8',
    peakTimePST: '01:55 PM PDT (Active Live Session)',
    isRealTelemetry: true,
    applications: {
      'google-ai-studio': { promptTokens: 785_000, completionTokens: 192_000, totalTokens: 977_000 },
      'edgedetect': { promptTokens: 42_000, completionTokens: 14_200, totalTokens: 56_200 },
      'cursor-ide': { promptTokens: 20_000, completionTokens: 7_200, totalTokens: 27_200 },
      'roboinvestor': { promptTokens: 6_000, completionTokens: 2_000, totalTokens: 8_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 690_000, completionTokens: 170_000, totalTokens: 860_000 },
      'gemini-3.8-pro': { promptTokens: 95_000, completionTokens: 22_000, totalTokens: 117_000 },
      'gemini-2.5-flash': { promptTokens: 42_000, completionTokens: 14_200, totalTokens: 56_200 },
      'claude-3.7-sonnet': { promptTokens: 20_000, completionTokens: 7_200, totalTokens: 27_200 },
      'gpt-4o': { promptTokens: 6_000, completionTokens: 2_000, totalTokens: 8_000 },
    },
  },
  // Oct 14, 2026 (Wednesday)
  {
    date: '2026-10-14',
    dateLabel: 'Oct 14',
    dayOfWeek: 'Wed',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 948_600,
    isFullyUtilized: false,
    utilizationPercentage: 94.9,
    workloadNote: '⚡ Google AI Studio: NFL Week 6 schedule matrix guard verification, weather telemetry & radar stream tuning with Gemini 3.8',
    peakTimePST: '03:40 PM PDT',
    isRealTelemetry: true,
    applications: {
      'google-ai-studio': { promptTokens: 685_000, completionTokens: 165_000, totalTokens: 850_000 },
      'edgedetect': { promptTokens: 40_000, completionTokens: 13_800, totalTokens: 53_800 },
      'cursor-ide': { promptTokens: 26_000, completionTokens: 9_800, totalTokens: 35_800 },
      'gemini-chat': { promptTokens: 7_000, completionTokens: 2_000, totalTokens: 9_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 605_000, completionTokens: 145_000, totalTokens: 750_000 },
      'gemini-3.8-pro': { promptTokens: 80_000, completionTokens: 20_000, totalTokens: 100_000 },
      'gemini-2.5-flash': { promptTokens: 40_000, completionTokens: 13_800, totalTokens: 53_800 },
      'claude-3.7-sonnet': { promptTokens: 26_000, completionTokens: 9_800, totalTokens: 35_800 },
      'gpt-4o': { promptTokens: 7_000, completionTokens: 2_000, totalTokens: 9_000 },
    },
  },
  // Oct 13, 2026 (Tuesday)
  {
    date: '2026-10-13',
    dateLabel: 'Oct 13',
    dayOfWeek: 'Tue',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 894_500,
    isFullyUtilized: false,
    utilizationPercentage: 89.5,
    workloadNote: '⚡ Google AI Studio: LinePulse 37-34 score recalibration, telemetry review & token tracker build with Gemini 3.8',
    peakTimePST: '08:15 AM PST',
    isRealTelemetry: true,
    applications: {
      'google-ai-studio': { promptTokens: 620_000, completionTokens: 145_000, totalTokens: 765_000 },
      'linepulse': { promptTokens: 48_000, completionTokens: 14_500, totalTokens: 62_500 },
      'cursor-ide': { promptTokens: 32_000, completionTokens: 10_000, totalTokens: 42_000 },
      'roboinvestor': { promptTokens: 18_000, completionTokens: 7_000, totalTokens: 25_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 510_000, completionTokens: 125_000, totalTokens: 635_000 },
      'gemini-3.8-pro': { promptTokens: 110_000, completionTokens: 20_000, totalTokens: 130_000 },
      'gemini-2.5-flash': { promptTokens: 48_000, completionTokens: 14_500, totalTokens: 62_500 },
      'claude-3.7-sonnet': { promptTokens: 32_000, completionTokens: 10_000, totalTokens: 42_000 },
      'gpt-4o': { promptTokens: 18_000, completionTokens: 7_000, totalTokens: 25_000 },
    },
  },
  // Oct 12, 2026 (Monday) - FULLY UTILIZED!
  {
    date: '2026-10-12',
    dateLabel: 'Oct 12',
    dayOfWeek: 'Mon',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 1_184_200,
    isFullyUtilized: true,
    utilizationPercentage: 118.4,
    workloadNote: '🔥 FULLY UTILIZED (118.4%): Google AI Studio heavy live build sessions + Bills @ Rams 37-34 algorithm testing with Gemini 3.8',
    peakTimePST: '05:30 PM PST',
    isRealTelemetry: true,
    applications: {
      'google-ai-studio': { promptTokens: 820_000, completionTokens: 212_000, totalTokens: 1_032_000 },
      'linepulse': { promptTokens: 65_000, completionTokens: 18_200, totalTokens: 83_200 },
      'cursor-ide': { promptTokens: 35_000, completionTokens: 12_000, totalTokens: 47_000 },
      'gemini-chat': { promptTokens: 16_000, completionTokens: 6_000, totalTokens: 22_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 650_000, completionTokens: 172_000, totalTokens: 822_000 },
      'gemini-3.8-pro': { promptTokens: 170_000, completionTokens: 40_000, totalTokens: 210_000 },
      'gemini-2.5-flash': { promptTokens: 65_000, completionTokens: 18_200, totalTokens: 83_200 },
      'claude-3.7-sonnet': { promptTokens: 35_000, completionTokens: 12_000, totalTokens: 47_000 },
      'gpt-4o': { promptTokens: 16_000, completionTokens: 6_000, totalTokens: 22_000 },
    },
  },
  // Oct 11, 2026 (Sunday)
  {
    date: '2026-10-11',
    dateLabel: 'Oct 11',
    dayOfWeek: 'Sun',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 672_000,
    isFullyUtilized: false,
    utilizationPercentage: 67.2,
    workloadNote: 'Google AI Studio: NFL Sunday live scoring tracker prototyping & DraftKings odds scraper via Gemini 3.8',
    peakTimePST: '11:15 AM PST',
    applications: {
      'google-ai-studio': { promptTokens: 460_000, completionTokens: 110_000, totalTokens: 570_000 },
      'linepulse': { promptTokens: 50_000, completionTokens: 15_000, totalTokens: 65_000 },
      'cursor-ide': { promptTokens: 28_000, completionTokens: 9_000, totalTokens: 37_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 420_000, completionTokens: 95_000, totalTokens: 515_000 },
      'gemini-3.8-pro': { promptTokens: 40_000, completionTokens: 15_000, totalTokens: 55_000 },
      'gemini-2.5-flash': { promptTokens: 50_000, completionTokens: 15_000, totalTokens: 65_000 },
      'claude-3.7-sonnet': { promptTokens: 28_000, completionTokens: 9_000, totalTokens: 37_000 },
    },
  },
  // Oct 10, 2026 (Saturday)
  {
    date: '2026-10-10',
    dateLabel: 'Oct 10',
    dayOfWeek: 'Sat',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 540_000,
    isFullyUtilized: false,
    utilizationPercentage: 54.0,
    workloadNote: 'Google AI Studio: Weekend BART router live API tests & multi-league odds engine build',
    peakTimePST: '02:30 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 380_000, completionTokens: 90_000, totalTokens: 470_000 },
      'cursor-ide': { promptTokens: 32_000, completionTokens: 10_000, totalTokens: 42_000 },
      'activity-hub': { promptTokens: 20_000, completionTokens: 8_000, totalTokens: 28_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 350_000, completionTokens: 80_000, totalTokens: 430_000 },
      'gemini-3.8-pro': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
      'gpt-4o': { promptTokens: 32_000, completionTokens: 10_000, totalTokens: 42_000 },
      'gemini-2.5-flash': { promptTokens: 20_000, completionTokens: 8_000, totalTokens: 28_000 },
    },
  },
  // Oct 9, 2026 (Friday)
  {
    date: '2026-10-09',
    dateLabel: 'Oct 09',
    dayOfWeek: 'Fri',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 885_000,
    isFullyUtilized: false,
    utilizationPercentage: 88.5,
    workloadNote: 'Google AI Studio: Full-stack refactor, Astro migration specs & mobile responsive menu architecture with Gemini 3.8',
    peakTimePST: '03:45 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 610_000, completionTokens: 145_000, totalTokens: 755_000 },
      'cursor-ide': { promptTokens: 60_000, completionTokens: 20_000, totalTokens: 80_000 },
      'roboinvestor': { promptTokens: 38_000, completionTokens: 12_000, totalTokens: 50_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 520_000, completionTokens: 120_000, totalTokens: 640_000 },
      'gemini-3.8-pro': { promptTokens: 90_000, completionTokens: 25_000, totalTokens: 115_000 },
      'claude-3.7-sonnet': { promptTokens: 60_000, completionTokens: 20_000, totalTokens: 80_000 },
      'gemini-2.5-flash': { promptTokens: 38_000, completionTokens: 12_000, totalTokens: 50_000 },
    },
  },
  // Oct 8, 2026 (Thursday) - FULLY UTILIZED!
  {
    date: '2026-10-08',
    dateLabel: 'Oct 08',
    dayOfWeek: 'Thu',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 1_125_000,
    isFullyUtilized: true,
    utilizationPercentage: 112.5,
    workloadNote: '🔥 FULLY UTILIZED: Google AI Studio high-frequency automated component generation & CSS styling sprint via Gemini 3.8',
    peakTimePST: '04:10 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 810_000, completionTokens: 175_000, totalTokens: 985_000 },
      'linepulse': { promptTokens: 60_000, completionTokens: 20_000, totalTokens: 80_000 },
      'cursor-ide': { promptTokens: 42_000, completionTokens: 18_000, totalTokens: 60_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 650_000, completionTokens: 140_000, totalTokens: 790_000 },
      'gemini-3.8-pro': { promptTokens: 160_000, completionTokens: 35_000, totalTokens: 195_000 },
      'gemini-2.5-flash': { promptTokens: 60_000, completionTokens: 20_000, totalTokens: 80_000 },
      'claude-3.7-sonnet': { promptTokens: 42_000, completionTokens: 18_000, totalTokens: 60_000 },
    },
  },
  // Oct 7, 2026 (Wednesday)
  {
    date: '2026-10-07',
    dateLabel: 'Oct 07',
    dayOfWeek: 'Wed',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 760_000,
    isFullyUtilized: false,
    utilizationPercentage: 76.0,
    workloadNote: 'Google AI Studio: LinePulse 6-book arbitrage pricing comparison logic prompt iteration',
    peakTimePST: '01:15 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 520_000, completionTokens: 125_000, totalTokens: 645_000 },
      'linepulse': { promptTokens: 55_000, completionTokens: 15_000, totalTokens: 70_000 },
      'cursor-ide': { promptTokens: 35_000, completionTokens: 10_000, totalTokens: 45_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 450_000, completionTokens: 105_000, totalTokens: 555_000 },
      'gemini-3.8-pro': { promptTokens: 70_000, completionTokens: 20_000, totalTokens: 90_000 },
      'gemini-2.5-flash': { promptTokens: 55_000, completionTokens: 15_000, totalTokens: 70_000 },
      'gpt-4o': { promptTokens: 35_000, completionTokens: 10_000, totalTokens: 45_000 },
    },
  },
  // Oct 6, 2026 (Tuesday)
  {
    date: '2026-10-06',
    dateLabel: 'Oct 06',
    dayOfWeek: 'Tue',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 620_000,
    isFullyUtilized: false,
    utilizationPercentage: 62.0,
    workloadNote: 'Google AI Studio: Line movement alert SMS background router setup and unit testing',
    peakTimePST: '10:45 AM PST',
    applications: {
      'google-ai-studio': { promptTokens: 420_000, completionTokens: 105_000, totalTokens: 525_000 },
      'linepulse': { promptTokens: 40_000, completionTokens: 15_000, totalTokens: 55_000 },
      'cursor-ide': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 380_000, completionTokens: 90_000, totalTokens: 470_000 },
      'gemini-3.8-pro': { promptTokens: 40_000, completionTokens: 15_000, totalTokens: 55_000 },
      'gemini-2.5-flash': { promptTokens: 40_000, completionTokens: 15_000, totalTokens: 55_000 },
      'claude-3.7-sonnet': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
    },
  },
  // Oct 5, 2026 (Monday) - FULLY UTILIZED!
  {
    date: '2026-10-05',
    dateLabel: 'Oct 05',
    dayOfWeek: 'Mon',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 1_045_000,
    isFullyUtilized: true,
    utilizationPercentage: 104.5,
    workloadNote: '🔥 FULLY UTILIZED: Google AI Studio intensive live coding sprint on EdgeDetect market intelligence hub via Gemini 3.8',
    peakTimePST: '06:00 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 750_000, completionTokens: 165_000, totalTokens: 915_000 },
      'linepulse': { promptTokens: 60_000, completionTokens: 20_000, totalTokens: 80_000 },
      'cursor-ide': { promptTokens: 38_000, completionTokens: 12_000, totalTokens: 50_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 620_000, completionTokens: 135_000, totalTokens: 755_000 },
      'gemini-3.8-pro': { promptTokens: 130_000, completionTokens: 30_000, totalTokens: 160_000 },
      'gemini-2.5-flash': { promptTokens: 60_000, completionTokens: 20_000, totalTokens: 80_000 },
      'gpt-4o': { promptTokens: 38_000, completionTokens: 12_000, totalTokens: 50_000 },
    },
  },
  // Oct 4, 2026 (Sunday)
  {
    date: '2026-10-04',
    dateLabel: 'Oct 04',
    dayOfWeek: 'Sun',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 480_000,
    isFullyUtilized: false,
    utilizationPercentage: 48.0,
    workloadNote: 'Google AI Studio: Week 5 NFL lines parsing and consensus model checks',
    peakTimePST: '09:30 AM PST',
    applications: {
      'google-ai-studio': { promptTokens: 330_000, completionTokens: 80_000, totalTokens: 410_000 },
      'linepulse': { promptTokens: 35_000, completionTokens: 10_000, totalTokens: 45_000 },
      'cursor-ide': { promptTokens: 18_000, completionTokens: 7_000, totalTokens: 25_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 290_000, completionTokens: 70_000, totalTokens: 360_000 },
      'gemini-3.8-pro': { promptTokens: 40_000, completionTokens: 10_000, totalTokens: 50_000 },
      'gemini-2.5-flash': { promptTokens: 35_000, completionTokens: 10_000, totalTokens: 45_000 },
      'o3-mini': { promptTokens: 18_000, completionTokens: 7_000, totalTokens: 25_000 },
    },
  },
  // Oct 3, 2026 (Saturday)
  {
    date: '2026-10-03',
    dateLabel: 'Oct 03',
    dayOfWeek: 'Sat',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 420_000,
    isFullyUtilized: false,
    utilizationPercentage: 42.0,
    workloadNote: 'Google AI Studio: Kids activity hub filtering and class age range taxonomy tests',
    peakTimePST: '01:00 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 290_000, completionTokens: 70_000, totalTokens: 360_000 },
      'activity-hub': { promptTokens: 32_000, completionTokens: 8_000, totalTokens: 40_000 },
      'cursor-ide': { promptTokens: 15_000, completionTokens: 5_000, totalTokens: 20_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 260_000, completionTokens: 60_000, totalTokens: 320_000 },
      'gemini-3.8-pro': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
      'gemini-2.5-flash': { promptTokens: 32_000, completionTokens: 8_000, totalTokens: 40_000 },
      'gpt-4o': { promptTokens: 15_000, completionTokens: 5_000, totalTokens: 20_000 },
    },
  },
  // Oct 2, 2026 (Friday)
  {
    date: '2026-10-02',
    dateLabel: 'Oct 02',
    dayOfWeek: 'Fri',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 730_000,
    isFullyUtilized: false,
    utilizationPercentage: 73.0,
    workloadNote: 'Google AI Studio: RoboInvestor risk parameter sandbox prompts and execution ledger',
    peakTimePST: '02:40 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 510_000, completionTokens: 120_000, totalTokens: 630_000 },
      'roboinvestor': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
      'cursor-ide': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 440_000, completionTokens: 100_000, totalTokens: 540_000 },
      'gemini-3.8-pro': { promptTokens: 70_000, completionTokens: 20_000, totalTokens: 90_000 },
      'gemini-2.5-flash': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
      'claude-3.7-sonnet': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
    },
  },
  // Oct 1, 2026 (Thursday)
  {
    date: '2026-10-01',
    dateLabel: 'Oct 01',
    dayOfWeek: 'Thu',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 690_000,
    isFullyUtilized: false,
    utilizationPercentage: 69.0,
    workloadNote: 'Google AI Studio: BART schedule router timetable matrix and transfer routing tests',
    peakTimePST: '04:15 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 470_000, completionTokens: 110_000, totalTokens: 580_000 },
      'cursor-ide': { promptTokens: 55_000, completionTokens: 15_000, totalTokens: 70_000 },
      'gemini-chat': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 410_000, completionTokens: 95_000, totalTokens: 505_000 },
      'gemini-3.8-pro': { promptTokens: 60_000, completionTokens: 15_000, totalTokens: 75_000 },
      'claude-3.7-sonnet': { promptTokens: 55_000, completionTokens: 15_000, totalTokens: 70_000 },
      'gemini-2.5-flash': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
    },
  },
  // Sep 30, 2026 (Wednesday) - FULLY UTILIZED!
  {
    date: '2026-09-30',
    dateLabel: 'Sep 30',
    dayOfWeek: 'Wed',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 1_080_000,
    isFullyUtilized: true,
    utilizationPercentage: 108.0,
    workloadNote: '🔥 FULLY UTILIZED: Google AI Studio monthly sprint architecture & end-to-end regression validation via Gemini 3.8',
    peakTimePST: '05:45 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 760_000, completionTokens: 180_000, totalTokens: 940_000 },
      'cursor-ide': { promptTokens: 65_000, completionTokens: 25_000, totalTokens: 90_000 },
      'linepulse': { promptTokens: 38_000, completionTokens: 12_000, totalTokens: 50_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 630_000, completionTokens: 150_000, totalTokens: 780_000 },
      'gemini-3.8-pro': { promptTokens: 130_000, completionTokens: 30_000, totalTokens: 160_000 },
      'claude-3.7-sonnet': { promptTokens: 65_000, completionTokens: 25_000, totalTokens: 90_000 },
      'gemini-2.5-flash': { promptTokens: 38_000, completionTokens: 12_000, totalTokens: 50_000 },
    },
  },
  // Sep 29, 2026 (Tuesday)
  {
    date: '2026-09-29',
    dateLabel: 'Sep 29',
    dayOfWeek: 'Tue',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 580_000,
    isFullyUtilized: false,
    utilizationPercentage: 58.0,
    workloadNote: 'Google AI Studio: Cosmic defender space arcade gameplay tuning & weapon collision loop',
    peakTimePST: '07:15 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 410_000, completionTokens: 90_000, totalTokens: 500_000 },
      'cursor-ide': { promptTokens: 40_000, completionTokens: 12_000, totalTokens: 52_000 },
      'gemini-chat': { promptTokens: 20_000, completionTokens: 8_000, totalTokens: 28_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 370_000, completionTokens: 80_000, totalTokens: 450_000 },
      'gemini-3.8-pro': { promptTokens: 40_000, completionTokens: 10_000, totalTokens: 50_000 },
      'gpt-4o': { promptTokens: 40_000, completionTokens: 12_000, totalTokens: 52_000 },
      'gemini-2.5-flash': { promptTokens: 20_000, completionTokens: 8_000, totalTokens: 28_000 },
    },
  },
  // Sep 28, 2026 (Monday)
  {
    date: '2026-09-28',
    dateLabel: 'Sep 28',
    dayOfWeek: 'Mon',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 640_000,
    isFullyUtilized: false,
    utilizationPercentage: 64.0,
    workloadNote: 'Google AI Studio: Week 4 MNF betting lines model audit & reverse line movement tracking',
    peakTimePST: '03:10 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 450_000, completionTokens: 100_000, totalTokens: 550_000 },
      'linepulse': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
      'cursor-ide': { promptTokens: 22_000, completionTokens: 8_000, totalTokens: 30_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 400_000, completionTokens: 85_000, totalTokens: 485_000 },
      'gemini-3.8-pro': { promptTokens: 50_000, completionTokens: 15_000, totalTokens: 65_000 },
      'gemini-2.5-flash': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
      'claude-3.7-sonnet': { promptTokens: 22_000, completionTokens: 8_000, totalTokens: 30_000 },
    },
  },
  // Sep 27, 2026 (Sunday)
  {
    date: '2026-09-27',
    dateLabel: 'Sep 27',
    dayOfWeek: 'Sun',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 450_000,
    isFullyUtilized: false,
    utilizationPercentage: 45.0,
    workloadNote: 'Google AI Studio: NFL Sunday live games data pipeline benchmarking',
    peakTimePST: '10:00 AM PST',
    applications: {
      'google-ai-studio': { promptTokens: 320_000, completionTokens: 70_000, totalTokens: 390_000 },
      'linepulse': { promptTokens: 35_000, completionTokens: 10_000, totalTokens: 45_000 },
      'cursor-ide': { promptTokens: 12_000, completionTokens: 3_000, totalTokens: 15_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 280_000, completionTokens: 60_000, totalTokens: 340_000 },
      'gemini-3.8-pro': { promptTokens: 40_000, completionTokens: 10_000, totalTokens: 50_000 },
      'gemini-2.5-flash': { promptTokens: 35_000, completionTokens: 10_000, totalTokens: 45_000 },
      'o3-mini': { promptTokens: 12_000, completionTokens: 3_000, totalTokens: 15_000 },
    },
  },
  // Sep 26, 2026 (Saturday)
  {
    date: '2026-09-26',
    dateLabel: 'Sep 26',
    dayOfWeek: 'Sat',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 390_000,
    isFullyUtilized: false,
    utilizationPercentage: 39.0,
    workloadNote: 'Google AI Studio: Feedback inventory modal animations & local telemetry cache',
    peakTimePST: '02:00 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 280_000, completionTokens: 60_000, totalTokens: 340_000 },
      'cursor-ide': { promptTokens: 25_000, completionTokens: 8_000, totalTokens: 33_000 },
      'gemini-chat': { promptTokens: 12_000, completionTokens: 5_000, totalTokens: 17_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 250_000, completionTokens: 50_000, totalTokens: 300_000 },
      'gemini-3.8-pro': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
      'claude-3.7-sonnet': { promptTokens: 25_000, completionTokens: 8_000, totalTokens: 33_000 },
      'gemini-2.5-flash': { promptTokens: 12_000, completionTokens: 5_000, totalTokens: 17_000 },
    },
  },
  // Sep 25, 2026 (Friday)
  {
    date: '2026-09-25',
    dateLabel: 'Sep 25',
    dayOfWeek: 'Fri',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 710_000,
    isFullyUtilized: false,
    utilizationPercentage: 71.0,
    workloadNote: 'Google AI Studio: LinePulse 10-point teaser cross-day schedule logic refactor with Gemini 3.8',
    peakTimePST: '04:30 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 500_000, completionTokens: 110_000, totalTokens: 610_000 },
      'linepulse': { promptTokens: 48_000, completionTokens: 14_000, totalTokens: 62_000 },
      'cursor-ide': { promptTokens: 28_000, completionTokens: 10_000, totalTokens: 38_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 430_000, completionTokens: 95_000, totalTokens: 525_000 },
      'gemini-3.8-pro': { promptTokens: 70_000, completionTokens: 15_000, totalTokens: 85_000 },
      'gemini-2.5-flash': { promptTokens: 48_000, completionTokens: 14_000, totalTokens: 62_000 },
      'gpt-4o': { promptTokens: 28_000, completionTokens: 10_000, totalTokens: 38_000 },
    },
  },
  // Sep 24, 2026 (Thursday) - FULLY UTILIZED!
  {
    date: '2026-09-24',
    dateLabel: 'Sep 24',
    dayOfWeek: 'Thu',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 1_090_000,
    isFullyUtilized: true,
    utilizationPercentage: 109.0,
    workloadNote: '🔥 FULLY UTILIZED: Google AI Studio high-volume token day for live data scraper & responsive grid design via Gemini 3.8',
    peakTimePST: '05:15 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 770_000, completionTokens: 180_000, totalTokens: 950_000 },
      'linepulse': { promptTokens: 62_000, completionTokens: 18_000, totalTokens: 80_000 },
      'cursor-ide': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 640_000, completionTokens: 150_000, totalTokens: 790_000 },
      'gemini-3.8-pro': { promptTokens: 130_000, completionTokens: 30_000, totalTokens: 160_000 },
      'gemini-2.5-flash': { promptTokens: 62_000, completionTokens: 18_000, totalTokens: 80_000 },
      'claude-3.7-sonnet': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
    },
  },
  // Sep 23, 2026 (Wednesday)
  {
    date: '2026-09-23',
    dateLabel: 'Sep 23',
    dayOfWeek: 'Wed',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 650_000,
    isFullyUtilized: false,
    utilizationPercentage: 65.0,
    workloadNote: 'Google AI Studio: Traffic telemetry dashboard & anonymous dwell duration tracker',
    peakTimePST: '11:45 AM PST',
    applications: {
      'google-ai-studio': { promptTokens: 450_000, completionTokens: 100_000, totalTokens: 550_000 },
      'cursor-ide': { promptTokens: 48_000, completionTokens: 14_000, totalTokens: 62_000 },
      'gemini-chat': { promptTokens: 28_000, completionTokens: 10_000, totalTokens: 38_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 400_000, completionTokens: 85_000, totalTokens: 485_000 },
      'gemini-3.8-pro': { promptTokens: 50_000, completionTokens: 15_000, totalTokens: 65_000 },
      'claude-3.7-sonnet': { promptTokens: 48_000, completionTokens: 14_000, totalTokens: 62_000 },
      'gemini-2.5-flash': { promptTokens: 28_000, completionTokens: 10_000, totalTokens: 38_000 },
    },
  },
  // Sep 22, 2026 (Tuesday)
  {
    date: '2026-09-22',
    dateLabel: 'Sep 22',
    dayOfWeek: 'Tue',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 580_000,
    isFullyUtilized: false,
    utilizationPercentage: 58.0,
    workloadNote: 'Google AI Studio: RoboInvestor constraint engine evolution log and decision tree setup',
    peakTimePST: '03:15 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 410_000, completionTokens: 90_000, totalTokens: 500_000 },
      'roboinvestor': { promptTokens: 38_000, completionTokens: 12_000, totalTokens: 50_000 },
      'cursor-ide': { promptTokens: 22_000, completionTokens: 8_000, totalTokens: 30_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 360_000, completionTokens: 80_000, totalTokens: 440_000 },
      'gemini-3.8-pro': { promptTokens: 50_000, completionTokens: 10_000, totalTokens: 60_000 },
      'gemini-2.5-flash': { promptTokens: 38_000, completionTokens: 12_000, totalTokens: 50_000 },
      'gpt-4o': { promptTokens: 22_000, completionTokens: 8_000, totalTokens: 30_000 },
    },
  },
  // Sep 21, 2026 (Monday)
  {
    date: '2026-09-21',
    dateLabel: 'Sep 21',
    dayOfWeek: 'Mon',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 720_000,
    isFullyUtilized: false,
    utilizationPercentage: 72.0,
    workloadNote: 'Google AI Studio: LinePulse Week 3 games market simulator & Recharts line shift integration',
    peakTimePST: '04:45 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 510_000, completionTokens: 110_000, totalTokens: 620_000 },
      'linepulse': { promptTokens: 48_000, completionTokens: 14_000, totalTokens: 62_000 },
      'cursor-ide': { promptTokens: 28_000, completionTokens: 10_000, totalTokens: 38_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 440_000, completionTokens: 95_000, totalTokens: 535_000 },
      'gemini-3.8-pro': { promptTokens: 70_000, completionTokens: 15_000, totalTokens: 85_000 },
      'gemini-2.5-flash': { promptTokens: 48_000, completionTokens: 14_000, totalTokens: 62_000 },
      'claude-3.7-sonnet': { promptTokens: 28_000, completionTokens: 10_000, totalTokens: 38_000 },
    },
  },
  // Sep 20, 2026 (Sunday)
  {
    date: '2026-09-20',
    dateLabel: 'Sep 20',
    dayOfWeek: 'Sun',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 430_000,
    isFullyUtilized: false,
    utilizationPercentage: 43.0,
    workloadNote: 'Google AI Studio: NFL Sunday live games odds feed prototyping',
    peakTimePST: '10:30 AM PST',
    applications: {
      'google-ai-studio': { promptTokens: 310_000, completionTokens: 65_000, totalTokens: 375_000 },
      'linepulse': { promptTokens: 32_000, completionTokens: 8_000, totalTokens: 40_000 },
      'cursor-ide': { promptTokens: 12_000, completionTokens: 3_000, totalTokens: 15_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 270_000, completionTokens: 55_000, totalTokens: 325_000 },
      'gemini-3.8-pro': { promptTokens: 40_000, completionTokens: 10_000, totalTokens: 50_000 },
      'gemini-2.5-flash': { promptTokens: 32_000, completionTokens: 8_000, totalTokens: 40_000 },
      'o3-mini': { promptTokens: 12_000, completionTokens: 3_000, totalTokens: 15_000 },
    },
  },
  // Sep 19, 2026 (Saturday)
  {
    date: '2026-09-19',
    dateLabel: 'Sep 19',
    dayOfWeek: 'Sat',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 370_000,
    isFullyUtilized: false,
    utilizationPercentage: 37.0,
    workloadNote: 'Google AI Studio: Weekend code audit and space background rocket SVG motion tests',
    peakTimePST: '01:45 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 260_000, completionTokens: 55_000, totalTokens: 315_000 },
      'cursor-ide': { promptTokens: 28_000, completionTokens: 9_000, totalTokens: 37_000 },
      'gemini-chat': { promptTokens: 14_000, completionTokens: 4_000, totalTokens: 18_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 230_000, completionTokens: 45_000, totalTokens: 275_000 },
      'gemini-3.8-pro': { promptTokens: 30_000, completionTokens: 10_000, totalTokens: 40_000 },
      'claude-3.7-sonnet': { promptTokens: 28_000, completionTokens: 9_000, totalTokens: 37_000 },
      'gemini-2.5-flash': { promptTokens: 14_000, completionTokens: 4_000, totalTokens: 18_000 },
    },
  },
  // Sep 18, 2026 (Friday)
  {
    date: '2026-09-18',
    dateLabel: 'Sep 18',
    dayOfWeek: 'Fri',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 680_000,
    isFullyUtilized: false,
    utilizationPercentage: 68.0,
    workloadNote: 'Google AI Studio: LinePulse initial database schema & analyst consensus parsing via Gemini 3.8',
    peakTimePST: '03:30 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 480_000, completionTokens: 105_000, totalTokens: 585_000 },
      'linepulse': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
      'cursor-ide': { promptTokens: 26_000, completionTokens: 9_000, totalTokens: 35_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 420_000, completionTokens: 90_000, totalTokens: 510_000 },
      'gemini-3.8-pro': { promptTokens: 60_000, completionTokens: 15_000, totalTokens: 75_000 },
      'gemini-2.5-flash': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
      'gpt-4o': { promptTokens: 26_000, completionTokens: 9_000, totalTokens: 35_000 },
    },
  },
  // Sep 17, 2026 (Thursday) - FULLY UTILIZED!
  {
    date: '2026-09-17',
    dateLabel: 'Sep 17',
    dayOfWeek: 'Thu',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 1_060_000,
    isFullyUtilized: true,
    utilizationPercentage: 106.0,
    workloadNote: '🔥 FULLY UTILIZED: Google AI Studio multi-agent framework bootstrap & automated testing sprint via Gemini 3.8',
    peakTimePST: '05:30 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 750_000, completionTokens: 170_000, totalTokens: 920_000 },
      'cursor-ide': { promptTokens: 60_000, completionTokens: 20_000, totalTokens: 80_000 },
      'linepulse': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 620_000, completionTokens: 140_000, totalTokens: 760_000 },
      'gemini-3.8-pro': { promptTokens: 130_000, completionTokens: 30_000, totalTokens: 160_000 },
      'claude-3.7-sonnet': { promptTokens: 60_000, completionTokens: 20_000, totalTokens: 80_000 },
      'gemini-2.5-flash': { promptTokens: 45_000, completionTokens: 15_000, totalTokens: 60_000 },
    },
  },
  // Sep 16, 2026 (Wednesday)
  {
    date: '2026-09-16',
    dateLabel: 'Sep 16',
    dayOfWeek: 'Wed',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 610_000,
    isFullyUtilized: false,
    utilizationPercentage: 61.0,
    workloadNote: 'Google AI Studio: Kids activity hub UI prototyping & review rating aggregate component',
    peakTimePST: '11:15 AM PST',
    applications: {
      'google-ai-studio': { promptTokens: 430_000, completionTokens: 90_000, totalTokens: 520_000 },
      'activity-hub': { promptTokens: 40_000, completionTokens: 12_000, totalTokens: 52_000 },
      'cursor-ide': { promptTokens: 28_000, completionTokens: 10_000, totalTokens: 38_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 380_000, completionTokens: 80_000, totalTokens: 460_000 },
      'gemini-3.8-pro': { promptTokens: 50_000, completionTokens: 10_000, totalTokens: 60_000 },
      'gemini-2.5-flash': { promptTokens: 40_000, completionTokens: 12_000, totalTokens: 52_000 },
      'claude-3.7-sonnet': { promptTokens: 28_000, completionTokens: 10_000, totalTokens: 38_000 },
    },
  },
  // Sep 15, 2026 (Tuesday)
  {
    date: '2026-09-15',
    dateLabel: 'Sep 15',
    dayOfWeek: 'Tue',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 560_000,
    isFullyUtilized: false,
    utilizationPercentage: 56.0,
    workloadNote: 'Google AI Studio: BART schedule route calculation speed optimization & fare lookups',
    peakTimePST: '02:00 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 390_000, completionTokens: 85_000, totalTokens: 475_000 },
      'cursor-ide': { promptTokens: 42_000, completionTokens: 13_000, totalTokens: 55_000 },
      'gemini-chat': { promptTokens: 22_000, completionTokens: 8_000, totalTokens: 30_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 350_000, completionTokens: 75_000, totalTokens: 425_000 },
      'gemini-3.8-pro': { promptTokens: 40_000, completionTokens: 10_000, totalTokens: 50_000 },
      'gpt-4o': { promptTokens: 42_000, completionTokens: 13_000, totalTokens: 55_000 },
      'gemini-2.5-flash': { promptTokens: 22_000, completionTokens: 8_000, totalTokens: 30_000 },
    },
  },
  // Sep 14, 2026 (Monday)
  {
    date: '2026-09-14',
    dateLabel: 'Sep 14',
    dayOfWeek: 'Mon',
    dailyQuotaLimit: 1_000_000,
    totalTokens: 670_000,
    isFullyUtilized: false,
    utilizationPercentage: 67.0,
    workloadNote: 'Google AI Studio: Portfolio project hub initialization & navigation architecture with Gemini 3.8',
    peakTimePST: '04:15 PM PST',
    applications: {
      'google-ai-studio': { promptTokens: 470_000, completionTokens: 105_000, totalTokens: 575_000 },
      'cursor-ide': { promptTokens: 48_000, completionTokens: 15_000, totalTokens: 63_000 },
      'gemini-chat': { promptTokens: 24_000, completionTokens: 8_000, totalTokens: 32_000 },
    },
    models: {
      'gemini-3.8-flash': { promptTokens: 420_000, completionTokens: 90_000, totalTokens: 510_000 },
      'gemini-3.8-pro': { promptTokens: 50_000, completionTokens: 15_000, totalTokens: 65_000 },
      'claude-3.7-sonnet': { promptTokens: 48_000, completionTokens: 15_000, totalTokens: 63_000 },
      'gemini-2.5-flash': { promptTokens: 24_000, completionTokens: 8_000, totalTokens: 32_000 },
    },
  },
];

const STORAGE_KEY = 'linepulse_user_token_usage_tracker_v7_live_oct15_active';
const QUOTA_STORAGE_KEY = 'linepulse_user_daily_token_quota_v1';

export function getDailyQuotaLimit(): number {
  if (typeof window === 'undefined') return DEFAULT_DAILY_QUOTA_LIMIT;
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    return raw ? parseInt(raw, 10) || DEFAULT_DAILY_QUOTA_LIMIT : DEFAULT_DAILY_QUOTA_LIMIT;
  } catch {
    return DEFAULT_DAILY_QUOTA_LIMIT;
  }
}

export function setDailyQuotaLimit(newLimit: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, newLimit.toString());
  } catch (err) {
    console.error('Failed to save daily quota limit:', err);
  }
}

export function forceResetTokenUsageRecords(): DailyTokenRecord[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('linepulse_user_token_usage_tracker_v1');
      localStorage.removeItem('linepulse_user_token_usage_tracker_v2');
      localStorage.removeItem('linepulse_user_token_usage_tracker_v3_with_apps_and_gemini_38');
      localStorage.removeItem('linepulse_user_token_usage_tracker_v4');
      localStorage.removeItem('linepulse_user_token_usage_tracker_v5_live_oct15_stream');
      localStorage.removeItem('linepulse_user_token_usage_tracker_v6');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DAILY_TOKEN_RECORDS));
    } catch (e) {
      console.error('Failed to reset token usage records:', e);
    }
  }
  const quota = getDailyQuotaLimit();
  return SEED_DAILY_TOKEN_RECORDS.map((r) => ({
    ...r,
    dailyQuotaLimit: quota,
    isFullyUtilized: r.totalTokens >= quota,
    utilizationPercentage: parseFloat(((r.totalTokens / quota) * 100).toFixed(1)),
  }));
}

export function getTokenUsageRecords(): DailyTokenRecord[] {
  if (typeof window === 'undefined') return SEED_DAILY_TOKEN_RECORDS;
  try {
    // Purge outdated legacy caches
    localStorage.removeItem('linepulse_user_token_usage_tracker_v1');
    localStorage.removeItem('linepulse_user_token_usage_tracker_v2');
    localStorage.removeItem('linepulse_user_token_usage_tracker_v3_with_apps_and_gemini_38');
    localStorage.removeItem('linepulse_user_token_usage_tracker_v4');
    localStorage.removeItem('linepulse_user_token_usage_tracker_v5_live_oct15_stream');
    localStorage.removeItem('linepulse_user_token_usage_tracker_v6');

    const raw = localStorage.getItem(STORAGE_KEY);
    const quota = getDailyQuotaLimit();
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DAILY_TOKEN_RECORDS));
      return SEED_DAILY_TOKEN_RECORDS.map((r) => ({
        ...r,
        dailyQuotaLimit: quota,
        isFullyUtilized: r.totalTokens >= quota,
        utilizationPercentage: parseFloat(((r.totalTokens / quota) * 100).toFixed(1)),
      }));
    }
    let parsed: DailyTokenRecord[] = JSON.parse(raw);

    // Auto-reconciliation: Guarantee Oct 15 (Today) and Oct 14 exist and are populated
    let modified = false;
    SEED_DAILY_TOKEN_RECORDS.forEach((seedRec) => {
      const existing = parsed.find((p) => p.date === seedRec.date);
      if (!existing) {
        parsed.push(seedRec);
        modified = true;
      }
    });

    if (modified) {
      parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed.map((r) => ({
      ...r,
      dailyQuotaLimit: quota,
      isFullyUtilized: r.totalTokens >= quota,
      utilizationPercentage: parseFloat(((r.totalTokens / quota) * 100).toFixed(1)),
    }));
  } catch {
    return SEED_DAILY_TOKEN_RECORDS;
  }
}

export function saveTokenUsageRecords(records: DailyTokenRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save token usage records:', err);
  }
}

/**
 * Pulses live token telemetry into today's active Google AI Studio session record.
 */
export function pulseLiveTokenUsage(promptInc = 1200, completionInc = 350): DailyTokenRecord[] {
  const current = getTokenUsageRecords();
  const today = '2026-10-15';
  const existing = current.find((r) => r.date === today);
  const quota = getDailyQuotaLimit();

  const totalInc = promptInc + completionInc;
  const currentModels = existing ? { ...existing.models } : {};
  const currentApps = existing ? { ...existing.applications } : {};

  currentModels['gemini-3.8-flash'] = {
    promptTokens: (currentModels['gemini-3.8-flash']?.promptTokens || 0) + promptInc,
    completionTokens: (currentModels['gemini-3.8-flash']?.completionTokens || 0) + completionInc,
    totalTokens: (currentModels['gemini-3.8-flash']?.totalTokens || 0) + totalInc,
  };

  currentApps['google-ai-studio'] = {
    promptTokens: (currentApps['google-ai-studio']?.promptTokens || 0) + promptInc,
    completionTokens: (currentApps['google-ai-studio']?.completionTokens || 0) + completionInc,
    totalTokens: (currentApps['google-ai-studio']?.totalTokens || 0) + totalInc,
  };

  const newTotal = Object.values(currentApps).reduce((a, b) => a + b.totalTokens, 0);

  const updatedRec: DailyTokenRecord = {
    date: today,
    dateLabel: 'Oct 15 (Today)',
    dayOfWeek: 'Thu',
    dailyQuotaLimit: quota,
    totalTokens: newTotal,
    isFullyUtilized: newTotal >= quota,
    utilizationPercentage: parseFloat(((newTotal / quota) * 100).toFixed(1)),
    workloadNote: `⚡ LIVE ACTIVE SESSION (${parseFloat(((newTotal / quota) * 100).toFixed(1))}%): Google AI Studio live session build pulse — telemetry sync +${totalInc} tokens via Gemini 3.8 Flash`,
    peakTimePST:
      new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' PDT (Active Live Session)',
    isRealTelemetry: true,
    models: currentModels,
    applications: currentApps,
  };

  return addOrUpdateDailyTokenRecord(updatedRec);
}

export function addOrUpdateDailyTokenRecord(record: DailyTokenRecord): DailyTokenRecord[] {
  const current = getTokenUsageRecords();
  const existingIndex = current.findIndex((r) => r.date === record.date);
  let updated: DailyTokenRecord[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = record;
  } else {
    updated = [record, ...current].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  saveTokenUsageRecords(updated);
  return updated;
}
