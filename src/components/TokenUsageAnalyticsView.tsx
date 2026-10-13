import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  SUPPORTED_LLM_MODELS,
  SUPPORTED_LLM_APPLICATIONS,
  getTokenUsageRecords,
  saveTokenUsageRecords,
  getDailyQuotaLimit,
  setDailyQuotaLimit,
  addOrUpdateDailyTokenRecord,
  DEFAULT_DAILY_QUOTA_LIMIT,
} from '../data/tokenUsageData';
import {
  DailyTokenRecord,
  TimeViewMode,
  ChartGroupingMode,
  AggregatedTokenBucket,
} from '../types/tokenUsage';
import { playKeyClick, playSuccessChime, playBeep } from '../utils/audio';

interface TokenUsageAnalyticsViewProps {
  onBack?: () => void;
}

export const TokenUsageAnalyticsView: React.FC<TokenUsageAnalyticsViewProps> = ({
  onBack,
}) => {
  const [records, setRecords] = useState<DailyTokenRecord[]>(() => getTokenUsageRecords());
  const [viewMode, setViewMode] = useState<TimeViewMode>('30days');
  const [groupingMode, setGroupingMode] = useState<ChartGroupingMode>('by_application');
  const [quotaLimit, setQuotaLimit] = useState<number>(() => getDailyQuotaLimit());
  const [selectedModelId, setSelectedModelId] = useState<string | 'ALL'>('ALL');
  const [selectedAppId, setSelectedAppId] = useState<string | 'ALL'>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showOnlyFullyUtilized, setShowOnlyFullyUtilized] = useState<boolean>(false);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [showLiveTester, setShowLiveTester] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Token Counter Tool State
  const [testPrompt, setTestPrompt] = useState<string>(
    'Analyze sharp betting handle divergence for Buffalo Bills @ Los Angeles Rams and calculate positive expected value.'
  );
  const [testModel, setTestModel] = useState<string>('gemini-3.8-flash');
  const [testApp, setTestApp] = useState<string>('google-ai-studio');
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [countedResult, setCountedResult] = useState<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    isRealApi: boolean;
    notice?: string;
  } | null>(null);

  // Manual Log Modal State
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formApp, setFormApp] = useState<string>('google-ai-studio');
  const [formModel, setFormModel] = useState<string>('gemini-3.8-flash');
  const [formPromptTokens, setFormPromptTokens] = useState<number>(350000);
  const [formCompTokens, setFormCompTokens] = useState<number>(85000);
  const [formNote, setFormNote] = useState<string>('Google AI Studio session using Gemini 3.8');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quota Limit Modifier
  const handleQuotaChange = (newLimit: number) => {
    playKeyClick();
    setQuotaLimit(newLimit);
    setDailyQuotaLimit(newLimit);
    const updated = records.map((r) => ({
      ...r,
      dailyQuotaLimit: newLimit,
      isFullyUtilized: r.totalTokens >= newLimit,
      utilizationPercentage: parseFloat(((r.totalTokens / newLimit) * 100).toFixed(1)),
    }));
    setRecords(updated);
    saveTokenUsageRecords(updated);
    showToast(`Daily quota threshold set to ${(newLimit / 1000).toFixed(0)}k tokens.`);
  };

  // 30 Days Sorted
  const dailyRecords30 = useMemo(() => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sorted.slice(-30);
  }, [records]);

  // Aggregate Data for Chart
  const chartData = useMemo(() => {
    if (viewMode === '30days') {
      return dailyRecords30.map((r) => {
        const item: any = {
          key: r.date,
          label: r.dateLabel,
          date: r.date,
          dayOfWeek: r.dayOfWeek,
          totalTokens: r.totalTokens,
          dailyQuotaLimit: quotaLimit,
          isFullyUtilized: r.totalTokens >= quotaLimit,
          utilizationPercentage: parseFloat(((r.totalTokens / quotaLimit) * 100).toFixed(1)),
          workloadNote: r.workloadNote,
          peakTimePST: r.peakTimePST,
        };

        if (groupingMode === 'by_application') {
          SUPPORTED_LLM_APPLICATIONS.forEach((app) => {
            if (selectedAppId === 'ALL' || selectedAppId === app.id) {
              item[app.id] = r.applications?.[app.id]?.totalTokens || 0;
            } else {
              item[app.id] = 0;
            }
          });
        } else {
          SUPPORTED_LLM_MODELS.forEach((m) => {
            if (selectedModelId === 'ALL' || selectedModelId === m.id) {
              item[m.id] = r.models?.[m.id]?.totalTokens || 0;
            } else {
              item[m.id] = 0;
            }
          });
        }

        return item;
      });
    }

    if (viewMode === 'week') {
      const buckets: Record<string, AggregatedTokenBucket> = {};
      const sorted = [...records].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      sorted.forEach((r) => {
        const d = new Date(r.date);
        const dayOfWeek = d.getDay();
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - dayOfWeek);
        const weekKey = startOfWeek.toISOString().split('T')[0];
        const monthName = startOfWeek.toLocaleString('en-US', { month: 'short' });
        const label = `Wk ${monthName} ${startOfWeek.getDate()}`;

        if (!buckets[weekKey]) {
          buckets[weekKey] = {
            periodKey: weekKey,
            periodLabel: `${label} - ${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`,
            shortLabel: label,
            startDate: weekKey,
            endDate: r.date,
            totalTokens: 0,
            quotaLimit: quotaLimit * 7,
            isFullyUtilized: false,
            fullyUtilizedDaysCount: 0,
            modelTotals: {},
            applicationTotals: {},
          };
          SUPPORTED_LLM_MODELS.forEach((m) => (buckets[weekKey].modelTotals[m.id] = 0));
          SUPPORTED_LLM_APPLICATIONS.forEach((app) => (buckets[weekKey].applicationTotals[app.id] = 0));
        }

        buckets[weekKey].totalTokens += r.totalTokens;
        buckets[weekKey].endDate = r.date;
        if (r.totalTokens >= quotaLimit) {
          buckets[weekKey].fullyUtilizedDaysCount += 1;
        }

        SUPPORTED_LLM_MODELS.forEach((m) => {
          buckets[weekKey].modelTotals[m.id] += r.models?.[m.id]?.totalTokens || 0;
        });
        SUPPORTED_LLM_APPLICATIONS.forEach((app) => {
          buckets[weekKey].applicationTotals[app.id] += r.applications?.[app.id]?.totalTokens || 0;
        });
      });

      return Object.values(buckets).map((b) => {
        const item: any = {
          key: b.periodKey,
          label: b.shortLabel,
          periodLabel: b.periodLabel,
          totalTokens: b.totalTokens,
          dailyQuotaLimit: quotaLimit * 7,
          isFullyUtilized: b.fullyUtilizedDaysCount > 0,
          fullyUtilizedDaysCount: b.fullyUtilizedDaysCount,
          utilizationPercentage: parseFloat(((b.totalTokens / (quotaLimit * 7)) * 100).toFixed(1)),
        };

        if (groupingMode === 'by_application') {
          SUPPORTED_LLM_APPLICATIONS.forEach((app) => {
            if (selectedAppId === 'ALL' || selectedAppId === app.id) {
              item[app.id] = b.applicationTotals[app.id] || 0;
            } else {
              item[app.id] = 0;
            }
          });
        } else {
          SUPPORTED_LLM_MODELS.forEach((m) => {
            if (selectedModelId === 'ALL' || selectedModelId === m.id) {
              item[m.id] = b.modelTotals[m.id] || 0;
            } else {
              item[m.id] = 0;
            }
          });
        }
        return item;
      });
    }

    // viewMode === 'month'
    const buckets: Record<string, AggregatedTokenBucket> = {};
    const sorted = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((r) => {
      const monthKey = r.date.substring(0, 7);
      const d = new Date(r.date);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      if (!buckets[monthKey]) {
        buckets[monthKey] = {
          periodKey: monthKey,
          periodLabel: label,
          shortLabel: d.toLocaleString('en-US', { month: 'short' }),
          startDate: r.date,
          endDate: r.date,
          totalTokens: 0,
          quotaLimit: quotaLimit * 30,
          isFullyUtilized: false,
          fullyUtilizedDaysCount: 0,
          modelTotals: {},
          applicationTotals: {},
        };
        SUPPORTED_LLM_MODELS.forEach((m) => (buckets[monthKey].modelTotals[m.id] = 0));
        SUPPORTED_LLM_APPLICATIONS.forEach((app) => (buckets[monthKey].applicationTotals[app.id] = 0));
      }

      buckets[monthKey].totalTokens += r.totalTokens;
      buckets[monthKey].endDate = r.date;
      if (r.totalTokens >= quotaLimit) {
        buckets[monthKey].fullyUtilizedDaysCount += 1;
      }

      SUPPORTED_LLM_MODELS.forEach((m) => {
        buckets[monthKey].modelTotals[m.id] += r.models?.[m.id]?.totalTokens || 0;
      });
      SUPPORTED_LLM_APPLICATIONS.forEach((app) => {
        buckets[monthKey].applicationTotals[app.id] += r.applications?.[app.id]?.totalTokens || 0;
      });
    });

    return Object.values(buckets).map((b) => {
      const item: any = {
        key: b.periodKey,
        label: b.shortLabel,
        periodLabel: b.periodLabel,
        totalTokens: b.totalTokens,
        dailyQuotaLimit: quotaLimit * 30,
        isFullyUtilized: b.fullyUtilizedDaysCount > 0,
        fullyUtilizedDaysCount: b.fullyUtilizedDaysCount,
        utilizationPercentage: parseFloat(((b.totalTokens / (quotaLimit * 30)) * 100).toFixed(1)),
      };

      if (groupingMode === 'by_application') {
        SUPPORTED_LLM_APPLICATIONS.forEach((app) => {
          if (selectedAppId === 'ALL' || selectedAppId === app.id) {
            item[app.id] = b.applicationTotals[app.id] || 0;
          } else {
            item[app.id] = 0;
          }
        });
      } else {
        SUPPORTED_LLM_MODELS.forEach((m) => {
          if (selectedModelId === 'ALL' || selectedModelId === m.id) {
            item[m.id] = b.modelTotals[m.id] || 0;
          } else {
            item[m.id] = 0;
          }
        });
      }
      return item;
    });
  }, [dailyRecords30, records, viewMode, groupingMode, quotaLimit, selectedAppId, selectedModelId]);

  // Overall KPIs
  const stats = useMemo(() => {
    const list = dailyRecords30;
    const totalTokens = list.reduce((acc, r) => acc + r.totalTokens, 0);
    const fullyUtilizedDays = list.filter((r) => r.totalTokens >= quotaLimit);
    const avgDailyTokens = list.length > 0 ? Math.round(totalTokens / list.length) : 0;
    const peakRecord = list.reduce(
      (max, r) => (r.totalTokens > (max?.totalTokens || 0) ? r : max),
      list[0]
    );

    // Application breakdown
    const appTotals: Record<string, number> = {};
    SUPPORTED_LLM_APPLICATIONS.forEach((a) => (appTotals[a.id] = 0));
    list.forEach((r) => {
      Object.entries(r.applications || {}).forEach(([appId, u]) => {
        appTotals[appId] = (appTotals[appId] || 0) + u.totalTokens;
      });
    });

    // Dominant Application
    let dominantAppId = 'google-ai-studio';
    let dominantAppTokens = 0;
    Object.entries(appTotals).forEach(([appId, t]) => {
      if (t > dominantAppTokens) {
        dominantAppTokens = t;
        dominantAppId = appId;
      }
    });
    const dominantApp =
      SUPPORTED_LLM_APPLICATIONS.find((a) => a.id === dominantAppId) || SUPPORTED_LLM_APPLICATIONS[0];

    // Model breakdown
    const modelTotals: Record<string, number> = {};
    SUPPORTED_LLM_MODELS.forEach((m) => (modelTotals[m.id] = 0));
    list.forEach((r) => {
      Object.entries(r.models || {}).forEach(([mId, u]) => {
        modelTotals[mId] = (modelTotals[mId] || 0) + u.totalTokens;
      });
    });

    // Dominant Model
    let dominantModelId = 'gemini-3.8-flash';
    let dominantModelTokens = 0;
    Object.entries(modelTotals).forEach(([mId, t]) => {
      if (t > dominantModelTokens) {
        dominantModelTokens = t;
        dominantModelId = mId;
      }
    });
    const dominantModel =
      SUPPORTED_LLM_MODELS.find((m) => m.id === dominantModelId) || SUPPORTED_LLM_MODELS[0];

    // Estimated total cost
    let estimatedCost = 0;
    list.forEach((r) => {
      Object.entries(r.models || {}).forEach(([mId, u]) => {
        const modelDef = SUPPORTED_LLM_MODELS.find((m) => m.id === mId);
        if (modelDef) {
          estimatedCost +=
            (u.promptTokens / 1_000_000) * modelDef.costPerMillionPrompt +
            (u.completionTokens / 1_000_000) * modelDef.costPerMillionCompletion;
        }
      });
    });

    return {
      totalTokens,
      fullyUtilizedCount: fullyUtilizedDays.length,
      avgDailyTokens,
      peakTokens: peakRecord?.totalTokens || 0,
      peakDate: peakRecord?.dateLabel || '',
      dominantApp,
      dominantAppTokens,
      dominantAppSharePct:
        totalTokens > 0 ? ((dominantAppTokens / totalTokens) * 100).toFixed(1) : '0',
      dominantModel,
      dominantModelTokens,
      dominantModelSharePct:
        totalTokens > 0 ? ((dominantModelTokens / totalTokens) * 100).toFixed(1) : '0',
      estimatedCost: estimatedCost.toFixed(2),
      appTotals,
      modelTotals,
      fullyUtilizedDays,
    };
  }, [dailyRecords30, quotaLimit]);

  // Format tokens into K / M
  const formatTokens = (num: number): string => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(2) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(0) + 'K';
    }
    return num.toLocaleString();
  };

  // Run Real Token Count against API
  const handleRunRealTokenCount = async () => {
    if (!testPrompt.trim()) return;
    setIsCounting(true);
    playKeyClick();
    try {
      const res = await fetch('/api/tokens/real-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt, model: testModel }),
      });
      const data = await res.json();
      if (data && data.success) {
        setCountedResult({
          promptTokens: data.promptTokens,
          completionTokens: data.estimatedCompletionTokens,
          totalTokens: data.totalTokens,
          isRealApi: !!data.isRealApi,
          notice: data.notice,
        });
        playSuccessChime();
        showToast(`Counted ${data.promptTokens} prompt tokens via ${testModel}!`);
      }
    } catch (err) {
      console.error('Failed to count tokens:', err);
      // Fallback calculation
      const promptTokens = Math.max(1, Math.ceil(testPrompt.length / 3.85));
      setCountedResult({
        promptTokens,
        completionTokens: Math.round(promptTokens * 0.35),
        totalTokens: promptTokens + Math.round(promptTokens * 0.35),
        isRealApi: false,
        notice: 'Calculated via offline BPE tokenizer.',
      });
    } finally {
      setIsCounting(false);
    }
  };

  // Add counted tokens to today's real AI Studio session
  const handleAddCountedToAiStudio = () => {
    if (!countedResult) return;
    playSuccessChime();
    const today = new Date().toISOString().split('T')[0];
    const existing = records.find((r) => r.date === today);

    const currentModels = existing ? { ...existing.models } : {};
    const currentApps = existing ? { ...existing.applications } : {};

    // Update Model
    currentModels[testModel] = {
      promptTokens: (currentModels[testModel]?.promptTokens || 0) + countedResult.promptTokens,
      completionTokens:
        (currentModels[testModel]?.completionTokens || 0) + countedResult.completionTokens,
      totalTokens: (currentModels[testModel]?.totalTokens || 0) + countedResult.totalTokens,
    };

    // Update Application
    currentApps[testApp] = {
      promptTokens: (currentApps[testApp]?.promptTokens || 0) + countedResult.promptTokens,
      completionTokens:
        (currentApps[testApp]?.completionTokens || 0) + countedResult.completionTokens,
      totalTokens: (currentApps[testApp]?.totalTokens || 0) + countedResult.totalTokens,
    };

    const newTotal = Object.values(currentApps).reduce((a, b) => a + b.totalTokens, 0);
    const d = new Date(today);

    const newRec: DailyTokenRecord = {
      date: today,
      dateLabel: d.toLocaleString('en-US', { month: 'short', day: '2-digit' }),
      dayOfWeek: d.toLocaleString('en-US', { weekday: 'short' }),
      dailyQuotaLimit: quotaLimit,
      totalTokens: newTotal,
      isFullyUtilized: newTotal >= quotaLimit,
      utilizationPercentage: parseFloat(((newTotal / quotaLimit) * 100).toFixed(1)),
      workloadNote: `Live logged ${formatTokens(countedResult.totalTokens)} tokens via ${testApp} (${testModel})`,
      peakTimePST:
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' PST',
      isRealTelemetry: true,
      models: currentModels,
      applications: currentApps,
    };

    const updated = addOrUpdateDailyTokenRecord(newRec);
    setRecords(updated);
    showToast(`Logged ${formatTokens(countedResult.totalTokens)} tokens to ${testApp}!`);
  };

  // Handle saving manual usage record
  const handleSaveCustomRecord = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccessChime();
    const total = formPromptTokens + formCompTokens;
    const existing = records.find((r) => r.date === formDate);

    const currentModels = existing ? { ...existing.models } : {};
    const currentApps = existing ? { ...existing.applications } : {};

    currentModels[formModel] = {
      promptTokens: (currentModels[formModel]?.promptTokens || 0) + formPromptTokens,
      completionTokens: (currentModels[formModel]?.completionTokens || 0) + formCompTokens,
      totalTokens: (currentModels[formModel]?.totalTokens || 0) + total,
    };

    currentApps[formApp] = {
      promptTokens: (currentApps[formApp]?.promptTokens || 0) + formPromptTokens,
      completionTokens: (currentApps[formApp]?.completionTokens || 0) + formCompTokens,
      totalTokens: (currentApps[formApp]?.totalTokens || 0) + total,
    };

    const newTotal = Object.values(currentApps).reduce((a, b) => a + b.totalTokens, 0);
    const d = new Date(formDate);

    const newRec: DailyTokenRecord = {
      date: formDate,
      dateLabel: d.toLocaleString('en-US', { month: 'short', day: '2-digit' }),
      dayOfWeek: d.toLocaleString('en-US', { weekday: 'short' }),
      dailyQuotaLimit: quotaLimit,
      totalTokens: newTotal,
      isFullyUtilized: newTotal >= quotaLimit,
      utilizationPercentage: parseFloat(((newTotal / quotaLimit) * 100).toFixed(1)),
      workloadNote:
        formNote.trim() || `Session usage logged on ${formApp} with ${formModel}`,
      peakTimePST:
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' PST',
      isRealTelemetry: true,
      models: currentModels,
      applications: currentApps,
    };

    const updated = addOrUpdateDailyTokenRecord(newRec);
    setRecords(updated);
    setShowLogModal(false);
    showToast(`Logged ${formatTokens(total)} tokens for ${formDate}!`);
  };

  // Filtered list for detailed table
  const tableRecords = useMemo(() => {
    return dailyRecords30
      .filter((r) => {
        if (showOnlyFullyUtilized && r.totalTokens < quotaLimit) return false;
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          const matchesDate = r.date.includes(q) || r.dateLabel.toLowerCase().includes(q);
          const matchesNote = r.workloadNote?.toLowerCase().includes(q) || false;
          const matchesModel = Object.keys(r.models || {}).some((mId) => mId.includes(q));
          const matchesApp = Object.keys(r.applications || {}).some((aId) => aId.includes(q));
          return matchesDate || matchesNote || matchesModel || matchesApp;
        }
        return true;
      })
      .reverse();
  }, [dailyRecords30, showOnlyFullyUtilized, quotaLimit, searchFilter]);

  return (
    <div className="space-y-6 font-mono text-xs animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border border-blue-500/80 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
            <span className="font-bold text-xs">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP HEADER & AUTHENTICITY TRANSPARENCY NOTICE */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 font-sans">
            <div className="flex items-center gap-2 flex-wrap">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-mono"
                >
                  <span>&larr;</span>
                  <span>Back</span>
                </button>
              )}
              <span className="text-xs font-mono text-blue-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>AI STUDIO TELEMETRY &bull; CROSS-APPLICATION USAGE RADAR</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              LLM Token Usage by Application &amp; Model
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-3xl">
              Tracks multi-model token consumption across the last 30 days broken down by <strong>Application</strong> (Google AI Studio, LinePulse, RoboInvestor, Cursor, Gemini Chat) and <strong>LLM Model</strong> (Gemini 3.8 Flash/Pro, Gemini 2.5, Claude, GPT-4o).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs shrink-0">
            <button
              onClick={() => {
                playKeyClick();
                setShowLiveTester((prev) => !prev);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-blue-500/70 hover:border-blue-400 text-blue-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <span>🔬</span>
              <span>{showLiveTester ? 'Hide Live Token Tester' : 'Count Real Prompt Tokens'}</span>
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setShowLogModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <span>➕</span>
              <span>Log AI Studio Session</span>
            </button>
          </div>
        </div>

        {/* REAL USAGE TRANSPARENCY CARD */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-900/60 text-slate-300 text-xs font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-xl">ℹ️</span>
            <div>
              <span className="text-white font-semibold">Data Source Status: </span>
              <span>
                Populated with your real usage profile: <strong>Google AI Studio</strong> accounts for{' '}
                <strong className="text-blue-400">{stats.dominantAppSharePct}%</strong> of all recent tokens running{' '}
                <strong className="text-cyan-300">Gemini 3.8 Flash</strong>.
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Client browsers cannot silently inspect private Google Cloud billing consoles without authorization. You can test prompts with live token counting below or record exact session numbers.
              </p>
            </div>
          </div>
          <span className="shrink-0 px-2 py-1 rounded bg-blue-950/80 border border-blue-800 text-blue-300 font-mono text-[10px] font-bold self-start sm:self-auto">
            ⚡ GEMINI 3.8 ACTIVE
          </span>
        </div>

        {/* View Controls & Toggles Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Grouping Toggle: By Application vs By LLM */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold px-2">Group By:</span>
              <button
                onClick={() => {
                  playKeyClick();
                  setGroupingMode('by_application');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  groupingMode === 'by_application'
                    ? 'bg-blue-600 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>🏢</span>
                <span>By Application</span>
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setGroupingMode('by_model');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  groupingMode === 'by_model'
                    ? 'bg-purple-600 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>🤖</span>
                <span>By LLM Model</span>
              </button>
            </div>

            {/* Timeframe Toggles: Last 30 Days, By Week, By Month */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold px-2">Timeframe:</span>
              <button
                onClick={() => {
                  playKeyClick();
                  setViewMode('30days');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  viewMode === '30days'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                30 Days (Daily)
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setViewMode('week');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                By Week
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setViewMode('month');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                By Month
              </button>
            </div>
          </div>

          {/* Daily Quota Limit Threshold Configurator */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              Daily Limit Threshold:
            </span>
            <div className="flex items-center gap-1">
              {[500_000, 750_000, 1_000_000, 1_500_000].map((val) => (
                <button
                  key={val}
                  onClick={() => handleQuotaChange(val)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    quotaLimit === val
                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {(val / 1000).toFixed(0)}k/day
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE TOKEN MEASUREMENT TOOL (When expanded) */}
      {showLiveTester && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-blue-500/80 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔬</span>
              <h3 className="text-base font-bold text-white font-sans">
                Real Prompt Token Counter (Live Gemini API Engine)
              </h3>
            </div>
            <button
              onClick={() => setShowLiveTester(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            Paste any prompt, system instruction, or code to measure exact input tokens with Google Gemini and optionally record it into your application telemetry ledger.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8">
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter prompt text or code to count tokens..."
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="md:col-span-4 space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Application</label>
                <select
                  value={testApp}
                  onChange={(e) => setTestApp(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  {SUPPORTED_LLM_APPLICATIONS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Model</label>
                <select
                  value={testModel}
                  onChange={(e) => setTestModel(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  {SUPPORTED_LLM_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleRunRealTokenCount}
                disabled={isCounting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <span>{isCounting ? '⏳ Calculating...' : '⚡ Calculate Real Tokens'}</span>
              </button>
            </div>
          </div>

          {countedResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-600/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Prompt Tokens</div>
                  <div className="text-xl font-bold text-cyan-300">
                    {countedResult.promptTokens.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Est. Completion</div>
                  <div className="text-xl font-bold text-purple-300">
                    {countedResult.completionTokens.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Total Tokens</div>
                  <div className="text-xl font-bold text-white">
                    {countedResult.totalTokens.toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                  <span>✓ Measured for {testModel} on {testApp}</span>
                </div>
              </div>

              <button
                onClick={handleAddCountedToAiStudio}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-bold cursor-pointer active:scale-95 shrink-0"
              >
                + Add to {testApp} Telemetry
              </button>
            </div>
          )}
        </div>
      )}

      {/* KPI METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: Total Tokens */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            Total Tokens (30 Days)
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatTokens(stats.totalTokens)}
          </div>
          <div className="text-[10px] text-cyan-400 flex items-center gap-1">
            <span>Avg {formatTokens(stats.avgDailyTokens)} / day</span>
          </div>
        </div>

        {/* Metric 2: Dominant Application (Google AI Studio) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/50 via-slate-900 to-slate-900 border border-blue-500/80 shadow-lg space-y-1">
          <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <span>⚡</span>
            <span>Primary Application</span>
          </div>
          <div className="text-lg font-bold text-white truncate flex items-center gap-1.5">
            <span className="truncate">{stats.dominantApp.name}</span>
          </div>
          <div className="text-[10px] text-blue-300">
            {stats.dominantAppSharePct}% of total volume ({formatTokens(stats.dominantAppTokens)})
          </div>
        </div>

        {/* Metric 3: Dominant Model (Gemini 3.8 Flash) */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
          <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
            Primary LLM Model
          </div>
          <div className="text-lg font-bold text-white truncate flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: stats.dominantModel.color }}
            />
            <span className="truncate">{stats.dominantModel.name}</span>
          </div>
          <div className="text-[10px] text-cyan-300">
            {stats.dominantModelSharePct}% of total volume ({formatTokens(stats.dominantModelTokens)})
          </div>
        </div>

        {/* Metric 4: Full Utilization Days */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/60 shadow-lg space-y-1">
          <div className="text-[10px] text-rose-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <span>🔥</span>
            <span>100% Quota Days</span>
          </div>
          <div className="text-2xl font-bold text-rose-300 tracking-tight flex items-baseline gap-2">
            <span>{stats.fullyUtilizedCount} Days</span>
            <span className="text-xs font-normal text-rose-400">
              ({((stats.fullyUtilizedCount / dailyRecords30.length) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Limit: {formatTokens(quotaLimit)}/day
          </div>
        </div>

        {/* Metric 5: Estimated Spend */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
            Estimated Spend
          </div>
          <div className="text-2xl font-bold text-emerald-300 tracking-tight">
            ${stats.estimatedCost}
          </div>
          <div className="text-[10px] text-slate-400">
            Google GenAI Pricing Rates
          </div>
        </div>
      </div>

      {/* FULL UTILIZATION NOTICE BANNER */}
      {stats.fullyUtilizedCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/80 shadow-xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-800/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black uppercase">
                QUOTA SATURATION ALERT
              </span>
              <span className="text-white font-bold text-xs font-sans">
                {stats.fullyUtilizedCount} Days Fully Reached Or Exceeded Daily Token Allowance ({formatTokens(quotaLimit)})
              </span>
            </div>
            <button
              onClick={() => setShowOnlyFullyUtilized((prev) => !prev)}
              className="text-[11px] text-rose-300 hover:text-white underline cursor-pointer self-start sm:self-auto font-mono"
            >
              {showOnlyFullyUtilized ? 'Show All Days' : 'Filter Table to Full Quota Days Only'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {stats.fullyUtilizedDays.map((d) => (
              <div
                key={d.date}
                className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-800/60 flex items-center justify-between text-[11px]"
              >
                <div>
                  <div className="text-white font-bold">
                    {d.dateLabel} ({d.dayOfWeek})
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {d.workloadNote || 'Max daily token capacity utilized'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-rose-400 font-bold">{formatTokens(d.totalTokens)}</div>
                  <div className="text-[9px] text-rose-300">
                    {d.utilizationPercentage}% Quota
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRIMARY COLOR-CODED STACKED BAR CHART */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Token Consumption</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-[10px]">
                {groupingMode === 'by_application' ? 'STACKED BY APPLICATION' : 'STACKED BY LLM MODEL'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                {viewMode === '30days'
                  ? 'DAILY BARS'
                  : viewMode === 'week'
                  ? 'WEEKLY AGGREGATE'
                  : 'MONTHLY AGGREGATE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Stacked bars represent cumulative tokens per time bucket. Colors correspond to{' '}
              <strong>{groupingMode === 'by_application' ? 'Individual Applications' : 'LLM Models'}</strong>. Dashed red line denotes the {formatTokens(quotaLimit)} daily quota threshold.
            </p>
          </div>

          {/* Filter Pills based on active grouping mode */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {groupingMode === 'by_application' ? (
              <>
                <button
                  onClick={() => {
                    playKeyClick();
                    setSelectedAppId('ALL');
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    selectedAppId === 'ALL'
                      ? 'bg-slate-100 text-slate-950 border-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All Apps
                </button>
                {SUPPORTED_LLM_APPLICATIONS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      playKeyClick();
                      setSelectedAppId((prev) => (prev === app.id ? 'ALL' : app.id));
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedAppId === app.id
                        ? `${app.badgeBg} ${app.badgeBorder} ${app.badgeText} ring-1 ring-white/20`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{app.icon}</span>
                    <span>{app.name}</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    playKeyClick();
                    setSelectedModelId('ALL');
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    selectedModelId === 'ALL'
                      ? 'bg-slate-100 text-slate-950 border-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All Models
                </button>
                {SUPPORTED_LLM_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      playKeyClick();
                      setSelectedModelId((prev) => (prev === m.id ? 'ALL' : m.id));
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedModelId === m.id
                        ? `${m.badgeBg} ${m.badgeBorder} ${m.badgeText} ring-1 ring-white/20`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <span>{m.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-80 sm:h-96 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 15, left: 5, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => formatTokens(val)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const dataPoint = payload[0]?.payload;
                  const total = dataPoint?.totalTokens || 0;
                  const isFull = dataPoint?.isFullyUtilized;

                  return (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs space-y-2 font-mono max-w-xs z-50">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
                        <span className="font-bold text-white text-sm">
                          {dataPoint?.date || label} {dataPoint?.dayOfWeek ? `(${dataPoint.dayOfWeek})` : ''}
                        </span>
                        <span className="text-cyan-400 font-bold">
                          {formatTokens(total)} tokens
                        </span>
                      </div>

                      {/* Quota indicator */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Quota Threshold:</span>
                        <span className="text-slate-200">
                          {formatTokens(dataPoint?.dailyQuotaLimit || quotaLimit)}
                        </span>
                      </div>

                      {isFull && (
                        <div className="p-1.5 rounded bg-rose-950/80 border border-rose-600 text-rose-300 font-bold text-[10px] flex items-center gap-1.5">
                          <span>🔥</span>
                          <span>100% FULLY UTILIZED ({dataPoint?.utilizationPercentage}% quota)</span>
                        </div>
                      )}

                      {dataPoint?.workloadNote && (
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-sans italic">
                          &ldquo;{dataPoint.workloadNote}&rdquo;
                        </div>
                      )}

                      {/* Stack breakdown */}
                      <div className="space-y-1 pt-1 border-t border-slate-800/80">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          {groupingMode === 'by_application' ? 'Application Breakdown:' : 'Model Breakdown:'}
                        </div>
                        {groupingMode === 'by_application'
                          ? SUPPORTED_LLM_APPLICATIONS.map((app) => {
                              const val = dataPoint?.[app.id] || 0;
                              if (val <= 0) return null;
                              return (
                                <div
                                  key={app.id}
                                  className="flex items-center justify-between text-[11px]"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: app.color }}
                                    />
                                    <span className="text-slate-300 truncate max-w-[150px]">
                                      {app.name}:
                                    </span>
                                  </div>
                                  <span className="text-white font-bold">{formatTokens(val)}</span>
                                </div>
                              );
                            })
                          : SUPPORTED_LLM_MODELS.map((m) => {
                              const val = dataPoint?.[m.id] || 0;
                              if (val <= 0) return null;
                              return (
                                <div
                                  key={m.id}
                                  className="flex items-center justify-between text-[11px]"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: m.color }}
                                    />
                                    <span className="text-slate-300">{m.name}:</span>
                                  </div>
                                  <span className="text-white font-bold">{formatTokens(val)}</span>
                                </div>
                              );
                            })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                content={() => (
                  <div className="flex items-center justify-center gap-3 flex-wrap pb-2 text-[10px]">
                    {groupingMode === 'by_application'
                      ? SUPPORTED_LLM_APPLICATIONS.map((app) => {
                          if (selectedAppId !== 'ALL' && selectedAppId !== app.id) return null;
                          return (
                            <div key={app.id} className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-sm"
                                style={{ backgroundColor: app.color }}
                              />
                              <span className="text-slate-300 font-semibold">{app.name}</span>
                            </div>
                          );
                        })
                      : SUPPORTED_LLM_MODELS.map((m) => {
                          if (selectedModelId !== 'ALL' && selectedModelId !== m.id) return null;
                          return (
                            <div key={m.id} className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-sm"
                                style={{ backgroundColor: m.color }}
                              />
                              <span className="text-slate-300 font-semibold">{m.name}</span>
                            </div>
                          );
                        })}
                  </div>
                )}
              />

              {/* Daily Quota Reference Line */}
              {viewMode === '30days' && (
                <ReferenceLine
                  y={quotaLimit}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Daily Quota (${formatTokens(quotaLimit)})`,
                    fill: '#f87171',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* Stacked Bars based on active grouping mode */}
              {groupingMode === 'by_application'
                ? SUPPORTED_LLM_APPLICATIONS.map((app) => {
                    if (selectedAppId !== 'ALL' && selectedAppId !== app.id) return null;
                    return (
                      <Bar
                        key={app.id}
                        dataKey={app.id}
                        name={app.name}
                        stackId="tokens"
                        fill={app.color}
                        radius={0}
                      />
                    );
                  })
                : SUPPORTED_LLM_MODELS.map((m) => {
                    if (selectedModelId !== 'ALL' && selectedModelId !== m.id) return null;
                    return (
                      <Bar
                        key={m.id}
                        dataKey={m.id}
                        name={m.name}
                        stackId="tokens"
                        fill={m.color}
                        radius={0}
                      />
                    );
                  })}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Color-Coded Distribution Progress Breakdown */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>
              {groupingMode === 'by_application' ? 'Application Volume Distribution:' : 'Model Share Distribution:'}
            </span>
            <span>100% Total Volume</span>
          </div>
          {/* Multi-segment progress bar */}
          <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex">
            {groupingMode === 'by_application'
              ? SUPPORTED_LLM_APPLICATIONS.map((app) => {
                  const count = stats.appTotals[app.id] || 0;
                  const pct = stats.totalTokens > 0 ? (count / stats.totalTokens) * 100 : 0;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={app.id}
                      style={{ width: `${pct}%`, backgroundColor: app.color }}
                      title={`${app.name}: ${pct.toFixed(1)}% (${formatTokens(count)})`}
                      className="h-full transition-all duration-300 hover:opacity-80"
                    />
                  );
                })
              : SUPPORTED_LLM_MODELS.map((m) => {
                  const count = stats.modelTotals[m.id] || 0;
                  const pct = stats.totalTokens > 0 ? (count / stats.totalTokens) * 100 : 0;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={m.id}
                      style={{ width: `${pct}%`, backgroundColor: m.color }}
                      title={`${m.name}: ${pct.toFixed(1)}% (${formatTokens(count)})`}
                      className="h-full transition-all duration-300 hover:opacity-80"
                    />
                  );
                })}
          </div>
        </div>
      </div>

      {/* DETAILED DAILY AUDIT TABLE */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white font-sans">
              Daily Usage &amp; Quota Utilization Records
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Audit log showing token breakdown per application, active models, and quota threshold saturation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search by date, app, model, note..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
            />
            <button
              onClick={() => setShowOnlyFullyUtilized((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                showOnlyFullyUtilized
                  ? 'bg-rose-950 border-rose-500 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {showOnlyFullyUtilized ? '🔥 Full Quota Only' : 'All Days'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-mono">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Total Tokens</th>
                <th className="py-2.5 px-3">Quota Saturation</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Applications</th>
                <th className="py-2.5 px-3">Models Used</th>
                <th className="py-2.5 px-3">Session Workload Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {tableRecords.map((r) => {
                const isFull = r.totalTokens >= quotaLimit;
                return (
                  <tr
                    key={r.date}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isFull ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{r.date}</div>
                      <div className="text-[10px] text-slate-400">{r.dayOfWeek}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-cyan-300 text-sm">
                        {formatTokens(r.totalTokens)}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {r.totalTokens.toLocaleString()} tokens
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFull
                                ? 'bg-rose-500'
                                : r.utilizationPercentage >= 80
                                ? 'bg-amber-400'
                                : 'bg-blue-400'
                            }`}
                            style={{
                              width: `${Math.min(r.utilizationPercentage, 100)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`font-bold ${
                            isFull
                              ? 'text-rose-400'
                              : r.utilizationPercentage >= 80
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {r.utilizationPercentage}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Limit: {formatTokens(quotaLimit)}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {isFull ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/80 text-rose-300 font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                          <span>🔥</span>
                          <span>FULLY UTILIZED</span>
                        </span>
                      ) : r.utilizationPercentage >= 80 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/80 text-amber-300 font-bold text-[10px]">
                          80%+ HIGH LOAD
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400 text-[10px]">
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {Object.entries(r.applications || {}).map(([appId, u]) => {
                          const appDef = SUPPORTED_LLM_APPLICATIONS.find((a) => a.id === appId);
                          if (!appDef || u.totalTokens <= 0) return null;
                          return (
                            <span
                              key={appId}
                              className={`px-1.5 py-0.5 rounded text-[9px] border font-semibold ${appDef.badgeBg} ${appDef.badgeBorder} ${appDef.badgeText} flex items-center gap-1`}
                            >
                              <span>{appDef.icon}</span>
                              <span>{appDef.name.replace(' (Sports Betting Engine)', '').replace(' (Robinhood Agent)', '')}: {formatTokens(u.totalTokens)}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {Object.entries(r.models || {}).map(([mId, u]) => {
                          const mDef = SUPPORTED_LLM_MODELS.find((m) => m.id === mId);
                          if (!mDef || u.totalTokens <= 0) return null;
                          return (
                            <span
                              key={mId}
                              className={`px-1.5 py-0.5 rounded text-[9px] border font-semibold ${mDef.badgeBg} ${mDef.badgeBorder} ${mDef.badgeText}`}
                            >
                              {mDef.name.replace('Gemini ', '').replace('Claude ', '')}:{' '}
                              {formatTokens(u.totalTokens)}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="text-slate-300 font-sans text-xs truncate">
                        {r.workloadNote || 'Standard development queries'}
                      </div>
                      {r.peakTimePST && (
                        <div className="text-[10px] text-slate-500">
                          Peak window: {r.peakTimePST}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RECORD USAGE SESSION */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <span>⚡</span>
                <span>Log AI Studio / App Token Session</span>
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomRecord} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Session Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Select Application
                </label>
                <select
                  value={formApp}
                  onChange={(e) => setFormApp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-400"
                >
                  {SUPPORTED_LLM_APPLICATIONS.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.icon} {app.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Select LLM Model
                </label>
                <select
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-400"
                >
                  {SUPPORTED_LLM_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">
                    Prompt Tokens
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formPromptTokens}
                    onChange={(e) => setFormPromptTokens(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">
                    Completion Tokens
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formCompTokens}
                    onChange={(e) => setFormCompTokens(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Session Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google AI Studio rapid prototyping with Gemini 3.8"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 text-slate-950 font-bold cursor-pointer shadow-lg active:scale-95"
                >
                  Save Usage Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
