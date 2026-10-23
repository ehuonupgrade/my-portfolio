import React, { useState } from 'react';
import {
  MessageChannel,
  UnifiedMessageRequest,
  MessageSendResult,
  ClientApp,
  MessageTemplate,
} from '../../types/messaging';

interface LiveDispatchConsoleProps {
  clientApps: ClientApp[];
  templates: MessageTemplate[];
  onDispatchSuccess?: (result: MessageSendResult) => void;
}

export const LiveDispatchConsole: React.FC<LiveDispatchConsoleProps> = ({
  clientApps,
  templates,
  onDispatchSuccess,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(clientApps[0]?.id || 'edgedetect-app');
  const [selectedChannel, setSelectedChannel] = useState<MessageChannel>('facebook_messenger');
  const [recipientId, setRecipientId] = useState<string>('psid_781920384756');
  const [title, setTitle] = useState<string>('🔥 WHALE DIVERGENCE ALERT');
  const [text, setText] = useState<string>(
    'Syndicates hammer Chicago Bears -3.0 on Thursday Night Football. 79% handle inflow recorded at Soldier Field.'
  );
  const [mediaUrl, setMediaUrl] = useState<string>(
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'
  );
  const [buttonTitle, setButtonTitle] = useState<string>('View Live Board');
  const [buttonUrl, setButtonUrl] = useState<string>('https://huon.si/myprojects/edgedetect');

  const [isSending, setIsSending] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<MessageSendResult | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      if (tpl.channel !== 'ALL') {
        setSelectedChannel(tpl.channel);
      }
      setTitle(tpl.titlePattern || '');
      setText(
        tpl.bodyPattern
          .replace('{{matchup}}', 'Bears @ Packers')
          .replace('{{team_name}}', 'Chicago Bears')
          .replace('{{line}}', '-3.0')
          .replace('{{divergence}}', '34')
          .replace('{{game_time}}', 'Thu 8:15 PM EDT')
          .replace('{{order_id}}', '90124')
          .replace('{{customer_name}}', 'Alex')
          .replace('{{carrier}}', 'FedEx Express')
          .replace('{{est_date}}', 'Oct 24')
          .replace('{{app_name}}', 'Apex Guard')
          .replace('{{code}}', '948-102')
          .replace('{{date}}', 'Today')
          .replace('{{total_events}}', '12,450')
          .replace('{{success_rate}}', '99.8')
          .replace('{{avg_latency}}', '142')
      );
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    setLastResult(null);

    const payload: UnifiedMessageRequest = {
      appId: selectedAppId,
      channel: selectedChannel,
      recipientId,
      content: {
        title: title || undefined,
        text,
        mediaUrl: mediaUrl || undefined,
        buttons: buttonTitle
          ? [
              {
                title: buttonTitle,
                payloadOrUrl: buttonUrl || 'https://huon.si',
                type: 'web_url',
              },
            ]
          : undefined,
      },
      metadata: {
        dispatchedFrom: 'OmniSend Web Studio Console',
        environment: 'LIVE_TESTING',
      },
    };

    try {
      const res = await fetch('/api/v1/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OmniSend-App-Id': selectedAppId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.result) {
        setLastResult(data.result);
        if (onDispatchSuccess) {
          onDispatchSuccess(data.result);
        }
      } else {
        setLastResult({
          success: false,
          channel: selectedChannel,
          recipientId,
          error: data.error || 'Failed to dispatch message',
          latencyMs: 120,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setLastResult({
        success: false,
        channel: selectedChannel,
        recipientId,
        error: err.message || 'Network connection failed',
        latencyMs: 110,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/40 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-1">
            <span>LIVE DISPATCHER CONSOLE</span>
            <span>·</span>
            <span>MULTI-CHANNEL ROUTER</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Universal Notification Studio &amp; Payload Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Craft, preview, and dispatch test payloads across Facebook Messenger, Slack, Telegram, WhatsApp &amp; SMS.
          </p>
        </div>

        {/* Quick Template Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400 shrink-0">Template:</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleApplyTemplate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 px-3 py-1.5 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">-- Custom Payload --</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Dispatch Request Parameters
            </h3>
            <span className="text-[11px] font-mono text-slate-400">API Endpoint: POST /api/v1/messages/send</span>
          </div>

          {/* Row 1: Client App & Target Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 font-medium">
                Client Application
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {clientApps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 font-medium">
                Target Channel
              </label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value as MessageChannel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="facebook_messenger">⚡ Facebook Messenger (Graph API)</option>
                <option value="slack">💬 Slack Incoming Webhook</option>
                <option value="telegram">✈️ Telegram Bot API</option>
                <option value="whatsapp">🟢 WhatsApp Business API</option>
                <option value="twilio_sms">📱 Twilio SMS &amp; MMS</option>
                <option value="custom_webhook">🔗 Custom HTTP Webhook</option>
              </select>
            </div>
          </div>

          {/* Row 2: Target Recipient ID */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 font-medium flex items-center justify-between">
              <span>Recipient Identifier</span>
              <span className="text-[10px] text-slate-500">
                {selectedChannel === 'facebook_messenger'
                  ? 'Facebook Page-Scoped User ID (PSID)'
                  : selectedChannel === 'slack'
                  ? 'Channel Name (#alerts) or Webhook URL'
                  : selectedChannel === 'telegram'
                  ? 'Telegram Chat ID'
                  : selectedChannel === 'twilio_sms'
                  ? 'Phone Number (+14155552671)'
                  : 'Target Endpoint URI'}
              </span>
            </label>
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder={
                selectedChannel === 'facebook_messenger'
                  ? 'psid_781920384756'
                  : selectedChannel === 'twilio_sms'
                  ? '+14155552671'
                  : '#alerts-channel'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Row 3: Message Title & Body Text */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 font-medium">
                Message Title (Optional Header)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="🔥 WEEK 7 MARQUEE ALERT"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 font-medium">
                Message Body Text (Required)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Type your message notification content here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Row 4: Attachment & Call-To-Action Button */}
          {selectedChannel === 'facebook_messenger' && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <div className="text-xs font-mono text-cyan-400 font-semibold flex items-center justify-between">
                <span>FB MESSENGER RICH CARDS &amp; BUTTONS</span>
                <span className="text-[10px] text-slate-500">v19.0 Graph Template</span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Media Attachment URL (Image Card Banner)
                </label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={buttonTitle}
                    onChange={(e) => setButtonTitle(e.target.value)}
                    placeholder="View Live Board"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    CTA Action Target URL
                  </label>
                  <input
                    type="text"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://huon.si/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Execute Action Bar */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              onClick={handleSend}
              disabled={isSending || !text.trim()}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isSending || !text.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-98'
              }`}
            >
              {isSending ? (
                <>
                  <span className="animate-spin text-sm">⚡</span>
                  <span>Dispatching Message...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Dispatch Message Now</span>
                </>
              )}
            </button>

            <span className="text-[11px] font-mono text-slate-500">
              Gateway Target: <strong className="text-slate-300">{selectedChannel}</strong>
            </span>
          </div>

          {/* Last Execution Outcome Alert */}
          {lastResult && (
            <div
              className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 animate-fadeIn ${
                lastResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  <span>{lastResult.success ? '✅ DISPATCH SUCCESSFUL' : '❌ DISPATCH FAILED'}</span>
                  {lastResult.isSimulated && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
                      GATEWAY SANDBOX MODE
                    </span>
                  )}
                </div>
                <span className="text-slate-400 font-normal">{lastResult.latencyMs}ms</span>
              </div>

              {lastResult.messageId && (
                <div>
                  <span className="text-slate-400">Message ID: </span>
                  <code className="text-cyan-300 font-semibold">{lastResult.messageId}</code>
                </div>
              )}

              {lastResult.error && (
                <div className="text-rose-300 text-[11px]">
                  <strong>Error Details:</strong> {lastResult.error}
                </div>
              )}

              {lastResult.providerResponse && (
                <details className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 cursor-pointer">
                  <summary className="hover:text-slate-200">View Provider API Response JSON</summary>
                  <pre className="mt-1 p-2 bg-slate-950 rounded border border-slate-800 overflow-x-auto text-[10px] text-cyan-200">
                    {JSON.stringify(lastResult.providerResponse, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Right Column: High-Fidelity Messenger & Channel Phone Mock Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>📱</span>
              <span>Live Phone Card Preview</span>
            </h3>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold">
              {selectedChannel.toUpperCase()}
            </span>
          </div>

          {/* Smartphone Bezel Mockup */}
          <div className="mx-auto max-w-[320px] bg-slate-950 border-4 border-slate-800 rounded-[2.5rem] p-3.5 shadow-2xl space-y-3 relative overflow-hidden">
            {/* Phone Speaker Notch */}
            <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-1"></div>

            {/* Chat App Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  ⚡
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">OmniSend Gateway</div>
                  <div className="text-[10px] text-slate-400">Verified Business Bot</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">Active</span>
            </div>

            {/* Chat Bubble Area */}
            <div className="min-h-[300px] bg-slate-900/90 rounded-2xl p-3 border border-slate-800/80 space-y-3">
              {/* Timestamp Header */}
              <div className="text-center text-[10px] font-mono text-slate-500">
                Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Bot Message Card */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md space-y-2">
                {/* Optional Media Header */}
                {selectedChannel === 'facebook_messenger' && mediaUrl && (
                  <div className="h-32 bg-slate-950 overflow-hidden relative">
                    <img
                      src={mediaUrl}
                      alt="Preview Attachment"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-slate-950/80 text-[9px] font-mono text-cyan-300 px-2 py-0.5 rounded backdrop-blur">
                      Meta Card Banner
                    </div>
                  </div>
                )}

                {/* Card Content Body */}
                <div className="p-3 space-y-1.5">
                  {title && (
                    <div className="text-xs font-bold text-white tracking-tight font-sans">
                      {title}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-300 leading-snug whitespace-pre-line font-sans">
                    {text || 'Message text body will appear here...'}
                  </div>
                </div>

                {/* CTA Button Slot */}
                {selectedChannel === 'facebook_messenger' && buttonTitle && (
                  <div className="border-t border-slate-700/80">
                    <a
                      href={buttonUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full py-2 text-center text-xs font-bold text-cyan-400 hover:bg-slate-700/50 transition-colors"
                    >
                      {buttonTitle} ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Recipient PSID Footer Note */}
              <div className="text-[10px] font-mono text-slate-500 text-right">
                Delivered to: <span className="text-slate-400">{recipientId || 'Target Recipient'}</span>
              </div>
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2"></div>
          </div>

          <div className="text-center text-[11px] text-slate-400 font-mono">
            Renders exactly as seen in Facebook Messenger, Slack, or Telegram apps.
          </div>
        </div>
      </div>
    </div>
  );
};
