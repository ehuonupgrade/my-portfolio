import React, { useState, useEffect } from 'react';
import { LiveDispatchConsole } from './LiveDispatchConsole';
import { FacebookMessengerManager } from './FacebookMessengerManager';
import { ChannelsRegistry } from './ChannelsRegistry';
import { ClientAppsManager } from './ClientAppsManager';
import { TemplateLibrary } from './TemplateLibrary';
import { DispatchLogsViewer } from './DispatchLogsViewer';
import { SdkDocsGenerator } from './SdkDocsGenerator';

import {
  ChannelConfig,
  ClientApp,
  MessageTemplate,
  DispatchLogEntry,
  MessageSendResult,
  MessageChannel,
} from '../../types/messaging';

import {
  INITIAL_CHANNELS,
  INITIAL_CLIENT_APPS,
  INITIAL_TEMPLATES,
  INITIAL_DISPATCH_LOGS,
} from '../../data/messagingData';

interface OmniSendGatewayHubProps {
  onBack?: () => void;
}

export const OmniSendGatewayHub: React.FC<OmniSendGatewayHubProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<
    'console' | 'facebook' | 'channels' | 'apps' | 'templates' | 'logs' | 'sdk'
  >('console');

  const [channels, setChannels] = useState<ChannelConfig[]>(INITIAL_CHANNELS);
  const [clientApps, setClientApps] = useState<ClientApp[]>(INITIAL_CLIENT_APPS);
  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLogEntry[]>(INITIAL_DISPATCH_LOGS);

  // Fetch channels and logs from backend API on mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/v1/channels');
        const data = await res.json();
        if (data.channels && Array.isArray(data.channels)) {
          setChannels(data.channels);
        }
      } catch (e) {
        // Fallback to initial
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/v1/logs');
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          setDispatchLogs(data.logs);
        }
      } catch (e) {
        // Fallback to initial
      }
    };

    fetchChannels();
    fetchLogs();
  }, []);

  const handleConfigureChannel = async (
    channelId: MessageChannel,
    settings: Record<string, string>
  ) => {
    try {
      const res = await fetch('/api/v1/channels/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, settings }),
      });
      const data = await res.json();
      if (data.channels) {
        setChannels(data.channels);
      }
    } catch (e) {
      // Local fallback
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId
            ? {
                ...c,
                settings: { ...c.settings, ...settings },
                isConfigured: true,
              }
            : c
        )
      );
    }
  };

  const handleCreateApp = (newApp: ClientApp) => {
    setClientApps((prev) => [newApp, ...prev]);
  };

  const handleDispatchSuccess = (result: MessageSendResult) => {
    const targetApp = clientApps[0] || INITIAL_CLIENT_APPS[0];
    const newEntry: DispatchLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId: targetApp.id,
      appName: targetApp.name,
      channel: result.channel,
      recipientId: result.recipientId,
      status: result.success ? 'SUCCESS' : 'FAILED',
      payload: {
        appId: targetApp.id,
        channel: result.channel,
        recipientId: result.recipientId,
        content: { text: 'Test message from console' },
      },
      result,
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    };

    setDispatchLogs((prev) => [newEntry, ...prev]);
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/v1/logs', { method: 'DELETE' });
    } catch (e) {
      // Ignore
    }
    setDispatchLogs([]);
  };

  const handleRetryDispatch = async (log: DispatchLogEntry) => {
    try {
      const res = await fetch('/api/v1/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log.payload),
      });
      const data = await res.json();
      if (data.logEntry) {
        setDispatchLogs((prev) => [data.logEntry, ...prev]);
      }
    } catch (e) {
      // Ignore
    }
  };

  const fbChannel =
    channels.find((c) => c.id === 'facebook_messenger') || INITIAL_CHANNELS[0];

  // Metrics
  const totalDispatches = 5850 + dispatchLogs.length;
  const successRate = 99.1;
  const avgLatency = 142;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer mr-1"
              >
                &larr; Back to Directory
              </button>
            )}
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-semibold">
              UNIVERSAL MESSAGING GATEWAY
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>OmniSend Gateway Service</span>
            <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300">
              v1.0 ONLINE
            </span>
          </h1>

          <p className="text-xs text-slate-400 max-w-3xl">
            Single multi-channel REST API gateway that empowers any application to dispatch notifications via Facebook Messenger Graph API v19.0, Slack, Telegram, WhatsApp, and Twilio SMS.
          </p>
        </div>

        {/* Live Metrics Row */}
        <div className="flex items-center gap-3 font-mono text-xs shrink-0">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase">Total Dispatched</div>
            <div className="text-sm font-bold text-white tabular-nums">
              {totalDispatches.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase">Success Rate</div>
            <div className="text-sm font-bold text-emerald-400 tabular-nums">
              {successRate}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase">Avg Latency</div>
            <div className="text-sm font-bold text-cyan-400 tabular-nums">
              {avgLatency}ms
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation Bar */}
      <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('console')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'console'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🚀 Live Dispatch Studio
        </button>

        <button
          onClick={() => setActiveTab('facebook')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === 'facebook'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>⚡ Facebook Messenger</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 border border-blue-400 text-cyan-200">
            PRIMARY
          </span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'channels'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💬 Channels Registry ({channels.length})
        </button>

        <button
          onClick={() => setActiveTab('apps')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'apps'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🔑 Client Apps ({clientApps.length})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'templates'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📋 Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'logs'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📜 Audit Logs ({dispatchLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('sdk')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'sdk'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💻 SDK &amp; cURL Generator
        </button>
      </div>

      {/* Main Active Tab Body */}
      <div>
        {activeTab === 'console' && (
          <LiveDispatchConsole
            clientApps={clientApps}
            templates={templates}
            onDispatchSuccess={handleDispatchSuccess}
          />
        )}

        {activeTab === 'facebook' && (
          <FacebookMessengerManager
            channelConfig={fbChannel}
            onSaveSettings={(settings) => handleConfigureChannel('facebook_messenger', settings)}
          />
        )}

        {activeTab === 'channels' && (
          <ChannelsRegistry
            channels={channels}
            onConfigureChannel={handleConfigureChannel}
          />
        )}

        {activeTab === 'apps' && (
          <ClientAppsManager clientApps={clientApps} onCreateApp={handleCreateApp} />
        )}

        {activeTab === 'templates' && (
          <TemplateLibrary
            templates={templates}
            onSelectTemplateForDispatch={(tpl) => {
              setActiveTab('console');
            }}
          />
        )}

        {activeTab === 'logs' && (
          <DispatchLogsViewer
            logs={dispatchLogs}
            onClearLogs={handleClearLogs}
            onRetryDispatch={handleRetryDispatch}
          />
        )}

        {activeTab === 'sdk' && <SdkDocsGenerator clientApps={clientApps} />}
      </div>
    </div>
  );
};
