import React, { useState } from 'react';
import { MessageTemplate, MessageChannel } from '../../types/messaging';

interface TemplateLibraryProps {
  templates: MessageTemplate[];
  onSelectTemplateForDispatch: (template: MessageTemplate) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  onSelectTemplateForDispatch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');

  const categories = ['ALL', 'ALERT', 'CONFIRMATION', 'SECURITY', 'DIGEST', 'MARKETING'];

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCat = selectedCategory === 'ALL' || tpl.category === selectedCategory;
    const matchesChan = selectedChannel === 'ALL' || tpl.channel === 'ALL' || tpl.channel === selectedChannel;
    return matchesCat && matchesChan;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/30 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-0.5">
            <span>NOTIFICATION TEMPLATE ENGINE</span>
            <span>·</span>
            <span>VARIABLE SUBSTITUTION</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Reusable Notification &amp; Alert Templates
          </h2>
          <p className="text-xs text-slate-400">
            Pre-formatted message blueprints with dynamic variable placeholders like <code>{`{{matchup}}`}</code> and <code>{`{{code}}`}</code>.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">Channel: All Channels</option>
            <option value="facebook_messenger">Facebook Messenger</option>
            <option value="slack">Slack</option>
            <option value="telegram">Telegram</option>
            <option value="twilio_sms">Twilio SMS</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      tpl.category === 'ALERT'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : tpl.category === 'SECURITY'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : tpl.category === 'CONFIRMATION'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}
                  >
                    {tpl.category}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">{tpl.name}</h3>
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  {tpl.channel === 'ALL' ? 'UNIVERSAL' : tpl.channel.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-normal">{tpl.description}</p>

              {/* Title Pattern */}
              {tpl.titlePattern && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 block">TITLE PATTERN</span>
                  <code className="text-xs font-mono text-white font-semibold block truncate">
                    {tpl.titlePattern}
                  </code>
                </div>
              )}

              {/* Body Pattern */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block">BODY PATTERN</span>
                <code className="text-xs font-mono text-cyan-200 block whitespace-pre-line leading-relaxed">
                  {tpl.bodyPattern}
                </code>
              </div>

              {/* Dynamic Variables Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-500">Variables:</span>
                {tpl.variables.map((v) => (
                  <span
                    key={v}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-amber-300"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => onSelectTemplateForDispatch(tpl)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Load into Dispatch Studio</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
