export interface LLMModelInfo {
  id: string;
  name: string;
  provider: 'Google' | 'Anthropic' | 'OpenAI' | 'DeepSeek';
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  costPerMillionPrompt: number;
  costPerMillionCompletion: number;
}

export interface LLMApplicationInfo {
  id: string;
  name: string;
  category: 'Developer Platform' | 'Internal Tool' | 'Autonomous Agent' | 'Productivity';
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: string;
  description: string;
}

export interface ModelTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ApplicationTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface DailyTokenRecord {
  date: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "Oct 13, 2026"
  dayOfWeek: string; // "Tue"
  models: Record<string, ModelTokenUsage>;
  applications: Record<string, ApplicationTokenUsage>;
  totalTokens: number;
  dailyQuotaLimit: number;
  isFullyUtilized: boolean; // totalTokens >= dailyQuotaLimit
  utilizationPercentage: number;
  workloadNote?: string;
  peakTimePST?: string;
  isRealTelemetry?: boolean;
}

export interface AggregatedTokenBucket {
  periodKey: string;
  periodLabel: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  totalTokens: number;
  quotaLimit: number;
  isFullyUtilized: boolean;
  fullyUtilizedDaysCount: number;
  modelTotals: Record<string, number>;
  applicationTotals: Record<string, number>;
  [key: string]: any; // Allow dynamic model/app keys for Recharts stacked bars
}

export type TimeViewMode = '30days' | 'week' | 'month';
export type ChartGroupingMode = 'by_model' | 'by_application';
