import React, { useState } from 'react';
import { ChannelConfig, MessageChannel } from '../../types/messaging';

interface ChannelsRegistryProps {
  channels: ChannelConfig[];
  onConfigureChannel: (channelId: MessageChannel, settings: Record<string, string>) => void;
}

export const ChannelsRegistry: React.FC<ChannelsRegistryProps> = ({
  channels,
  onConfigureChannel,
}) => {
  const [expandedChannelId, setExpandedChannelId] = useState<MessageChannel | null>(
    'facebook_messenger'
  );
  const [draftSettings, setDraftSettings] = useState<Record<string, Record<string, string>>>({});
  const [saveMessage, setSaveMessage] = useState<string>('');

  const handleToggleExpand = (id: MessageChannel) => {
    setExpandedChannelId((prev) => (prev === id ? null : id));
  };

  const handleFieldChange = (channelId: MessageChannel, key: string, value: string) => {
    setDraftSettings((prev) => ({
      ...prev,
      [channelId]: {
        ...(prev[channelId] || {}),
        [key]: value,
      },
    }));
  };

  const handleSaveChannel = (channel: ChannelConfig) => {
    const currentDraft = draftSettings[channel.id] || {};
    const updatedSettings = { ...channel.settings, ...currentDraft };
    onConfigureChannel(channel.id, updatedSettings);

    setSaveMessage(`Updated settings for ${channel.name}`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-0.5">
            <span>CHANNELS REGISTRY &amp; ADAPTERS</span>
            <span>·</span>
            <span>6 INTEGRATED PROVIDERS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Supported Messaging Providers &amp; Webhook Gateways
          </h2>
          <p className="text-xs text-slate-400">
            Configure integration credentials, webhook URLs, and delivery options per channel.
          </p>
        </div>

        {saveMessage && (
          <span className="text-xs font-mono text-emerald-400 font-semibold animate-fadeIn px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800">
            ✓ {saveMessage}
          </span>
        )}
      </div>

      {/* Channel Cards Grid */}
      <div className="space-y-4">
        {channels.map((channel) => {
          const isExpanded = expandedChannelId === channel.id;
          const currentDraft = draftSettings[channel.id] || {};

          return (
            <div
              key={channel.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-slate-900/90 border-cyan-500/60 shadow-xl shadow-cyan-500/5'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Channel Header Bar */}
              <div
                onClick={() => handleToggleExpand(channel.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                    {channel.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {channel.name}
                      </h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold border ${
                          channel.isConfigured
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        {channel.isConfigured ? 'READY' : 'UNCONFIGURED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                      {channel.description}
                    </p>
                  </div>
                </div>

                {/* Features & Drawer Toggle */}
                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono">
                    {Object.entries(channel.supportedFeatures).map(([feat, supported]) => (
                      <span
                        key={feat}
                        className={`px-2 py-0.5 rounded ${
                          supported
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-950 text-slate-600 line-through'
                        }`}
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExpand(channel.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {isExpanded ? 'Hide Settings ▲' : 'Configure Settings ▼'}
                  </button>
                </div>
              </div>

              {/* Expandable Configuration Drawer */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-800/90 bg-slate-950/60 space-y-4 animate-fadeIn">
                  <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                    {channel.name} Adapter Configuration
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(channel.settings).map(([key, val]) => {
                      const currentValue =
                        currentDraft[key] !== undefined ? currentDraft[key] : val;

                      return (
                        <div key={key}>
                          <label className="block text-xs font-mono text-slate-400 mb-1 capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </label>
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) =>
                              handleFieldChange(channel.id, key, e.target.value)
                            }
                            placeholder={`Enter ${key}...`}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Feature Matrix Badges */}
                  <div className="pt-2">
                    <span className="block text-[11px] font-mono text-slate-500 mb-1.5">
                      Supported Channel Payload Capabilities:
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {Object.entries(channel.supportedFeatures).map(([feat, supported]) => (
                        <span
                          key={feat}
                          className={`px-2.5 py-1 rounded-lg border ${
                            supported
                              ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 font-semibold'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {supported ? '✓' : '✕'} {feat.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Save Settings */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleSaveChannel(channel)}
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Save {channel.name} Configuration
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
