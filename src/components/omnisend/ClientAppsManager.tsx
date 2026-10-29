import React, { useState } from 'react';
import { ClientApp, MessageChannel } from '../../types/messaging';

interface ClientAppsManagerProps {
  clientApps: ClientApp[];
  onCreateApp: (app: ClientApp) => void;
}

export const ClientAppsManager: React.FC<ClientAppsManagerProps> = ({
  clientApps,
  onCreateApp,
}) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('');
  const [appDescription, setAppDescription] = useState<string>('');
  const [rateLimit, setRateLimit] = useState<number>(180);
  const [selectedChannels, setSelectedChannels] = useState<Set<MessageChannel>>(
    new Set(['facebook_messenger', 'slack'])
  );

  const [visibleKeyAppId, setVisibleKeyAppId] = useState<string | null>(null);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  const toggleChannelSelection = (ch: MessageChannel) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) {
        next.delete(ch);
      } else {
        next.add(ch);
      }
      return next;
    });
  };

  const handleCopyKey = (app: ClientApp) => {
    navigator.clipboard.writeText(app.apiKey);
    setCopiedAppId(app.id);
    setTimeout(() => setCopiedAppId(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;

    const newAppId = appName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-app';
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const newApp: ClientApp = {
      id: newAppId,
      name: appName.trim(),
      apiKey: `omni_live_${randomHex}`,
      description: appDescription.trim() || 'Internal consumer application.',
      createdDate: new Date().toISOString().split('T')[0],
      activeChannels: Array.from(selectedChannels),
      rateLimitPerMin: rateLimit,
      totalSent: 0,
      lastUsedAt: null,
    };

    onCreateApp(newApp);
    setShowCreateModal(false);
    setAppName('');
    setAppDescription('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/30 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-0.5">
            <span>CLIENT APPLICATIONS &amp; API KEYS</span>
            <span>·</span>
            <span>MULTI-TENANT ROUTER</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Registered Applications &amp; Security Credentials
          </h2>
          <p className="text-xs text-slate-400">
            Manage applications authorized to send notifications through OmniSend Gateway.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/20 shrink-0"
        >
          + Register New Client App
        </button>
      </div>

      {/* Client Apps Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientApps.map((app) => {
          const isKeyVisible = visibleKeyAppId === app.id;
          const isCopied = copiedAppId === app.id;

          return (
            <div
              key={app.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{app.name}</h3>
                  <span className="text-[11px] font-mono text-slate-500">App ID: {app.id}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {app.rateLimitPerMin} REQ/MIN
                </span>
              </div>

              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                {app.description}
              </p>

              {/* API Key Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>SECRET API KEY</span>
                  <button
                    onClick={() => setVisibleKeyAppId(isKeyVisible ? null : app.id)}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    {isKeyVisible ? 'Hide Key' : 'Reveal Key'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-cyan-300 truncate">
                    {isKeyVisible
                      ? app.apiKey
                      : `${app.apiKey.substring(0, 10)}********************`}
                  </code>

                  <button
                    onClick={() => handleCopyKey(app)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-200 hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                  >
                    {isCopied ? 'Copied! ✓' : 'Copy Key'}
                  </button>
                </div>
              </div>

              {/* Channels & Telemetry */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-1">
                  {app.activeChannels.map((ch) => (
                    <span
                      key={ch}
                      className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[10px] text-slate-300"
                    >
                      {ch.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <div className="text-slate-400 text-[11px]">
                  Total Sent: <strong className="text-white">{app.totalSent.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create App Form */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Register New Client Application
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 font-medium">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. AeroPay Billing Alert Service"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 font-medium">
                  Description / Purpose
                </label>
                <textarea
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief summary of messages dispatched by this service..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 font-medium">
                  Rate Limit (Requests per minute)
                </label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 font-medium">
                  Authorized Channels
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {(
                    [
                      'facebook_messenger',
                      'slack',
                      'telegram',
                      'whatsapp',
                      'twilio_sms',
                      'custom_webhook',
                    ] as MessageChannel[]
                  ).map((ch) => {
                    const isChecked = selectedChannels.has(ch);
                    return (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => toggleChannelSelection(ch)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {ch.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Generate API Key &amp; Register App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
