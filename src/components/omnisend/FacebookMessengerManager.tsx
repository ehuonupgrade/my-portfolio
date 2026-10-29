import React, { useState } from 'react';
import { ChannelConfig } from '../../types/messaging';

interface FacebookMessengerManagerProps {
  channelConfig: ChannelConfig;
  onSaveSettings: (settings: Record<string, string>) => void;
}

export const FacebookMessengerManager: React.FC<FacebookMessengerManagerProps> = ({
  channelConfig,
  onSaveSettings,
}) => {
  const [pageAccessToken, setPageAccessToken] = useState<string>(
    channelConfig.settings?.pageAccessToken || ''
  );
  const [pageId, setPageId] = useState<string>(channelConfig.settings?.pageId || '');
  const [verifyToken, setVerifyToken] = useState<string>(
    channelConfig.settings?.verifyToken || ''
  );
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  const [handshakeStatus, setHandshakeStatus] = useState<
    'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'
  >('IDLE');
  const [handshakeLog, setHandshakeLog] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string>('');

  const [simulatedPsid, setSimulatedPsid] = useState<string>('psid_892019283746');
  const [simulatedMessageText, setSimulatedMessageText] = useState<string>(
    'Hello! I would like to subscribe to daily sharp line alerts.'
  );
  const [inboundLog, setInboundLog] = useState<string>('');

  const webhookUrl =
    channelConfig.settings?.webhookUrl ||
    `${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/webhooks/messenger`;

  const handleCopyVerifyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleTestHandshake = async () => {
    setHandshakeStatus('TESTING');
    setHandshakeLog('Testing Meta Webhook Verification Handshake...');

    try {
      const challenge = `ch_${Math.random().toString(36).substring(2, 10)}`;
      const queryUrl = `/api/v1/webhooks/messenger?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
        verifyToken
      )}&hub.challenge=${challenge}`;

      const res = await fetch(queryUrl);
      const text = await res.text();

      if (res.ok && text === challenge) {
        setHandshakeStatus('SUCCESS');
        setHandshakeLog(
          `✅ Webhook Handshake Verified!\nHTTP 200 OK\nReturned Challenge Code: "${text}"\nMeta Graph API Webhook Callback verified successfully.`
        );
      } else {
        setHandshakeStatus('FAILED');
        setHandshakeLog(
          `❌ Webhook Handshake Failed (HTTP ${res.status}):\n${text || 'Verify token mismatch'}`
        );
      }
    } catch (err: any) {
      setHandshakeStatus('FAILED');
      setHandshakeLog(`❌ Handshake Network Error: ${err.message}`);
    }
  };

  const handleSimulateInboundMessage = async () => {
    setInboundLog('Sending simulated inbound Facebook Messenger webhook event...');

    const payload = {
      object: 'page',
      entry: [
        {
          id: pageId || '109283746152431',
          time: Date.now(),
          messaging: [
            {
              sender: { id: simulatedPsid },
              recipient: { id: pageId || '109283746152431' },
              timestamp: Date.now(),
              message: {
                mid: `mid.${Date.now()}:inbound_test`,
                text: simulatedMessageText,
              },
            },
          ],
        },
      ],
    };

    try {
      const res = await fetch('/api/v1/webhooks/messenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      if (res.ok) {
        setInboundLog(
          `✅ Inbound Message Event Processed (HTTP ${res.status} ${responseText})\nSender PSID: ${simulatedPsid}\nContent: "${simulatedMessageText}"`
        );
      } else {
        setInboundLog(`❌ Failed to deliver webhook event: HTTP ${res.status}`);
      }
    } catch (e: any) {
      setInboundLog(`❌ Error: ${e.message}`);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    onSaveSettings({
      pageAccessToken,
      pageId,
      verifyToken,
      webhookUrl,
      graphApiVersion: 'v19.0',
    });
    setTimeout(() => {
      setIsSaving(false);
      setSaveNotice('Settings saved to Gateway Server!');
      setTimeout(() => setSaveNotice(''), 3000);
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-0.5">
              <span>META GRAPH API V19.0</span>
              <span>·</span>
              <span>FACEBOOK MESSENGER</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Facebook Messenger Gateway &amp; Webhook Setup
            </h2>
            <p className="text-xs text-slate-400">
              Configure Page Access Tokens, verify Webhook Subscriptions, and test inbound messaging events.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 ${
              channelConfig.isConfigured
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${channelConfig.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            {channelConfig.isConfigured ? 'CONFIGURED & READY' : 'SANDBOX SIMULATION MODE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Token Configuration Panel (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-cyan-400">🔑</span>
              <span>Meta Graph Credentials &amp; Tokens</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Facebook Developer Console</span>
          </div>

          {/* Page Access Token */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-medium flex items-center justify-between">
              <span>Page Access Token (EAAG...)</span>
              <span className="text-[10px] text-slate-500">Required for Graph API Send</span>
            </label>
            <input
              type="text"
              value={pageAccessToken}
              onChange={(e) => setPageAccessToken(e.target.value)}
              placeholder="EAAG1098234857234958723948572938457293485..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Leave blank to run in <strong>Gateway Sandbox Mode</strong> (returns simulated high-fidelity response IDs).
            </p>
          </div>

          {/* Facebook Page ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1 font-medium">
                Facebook Page ID
              </label>
              <input
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="109283746152431"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1 font-medium">
                Graph API Version
              </label>
              <input
                type="text"
                disabled
                value="v19.0 (Latest Stable)"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Webhook Endpoint & Verify Token Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
            <div className="text-xs font-mono text-cyan-400 font-semibold flex items-center justify-between">
              <span>WEBHOOK SUBSCRIPTION CONFIGURATION</span>
              <span className="text-[10px] text-slate-500">GET/POST Handshake</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Callback URL for Meta Developer Console
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  Copy URL
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Verify Token (hub.verify_token)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleCopyVerifyToken}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedToken ? 'Copied! ✓' : 'Copy Token'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              {isSaving ? 'Saving...' : 'Save Facebook Configuration'}
            </button>

            {saveNotice && (
              <span className="text-xs font-mono text-emerald-400 font-semibold animate-fadeIn">
                ✓ {saveNotice}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Handshake Tester & Inbound Webhook Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Handshake Verification Tester */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>🤝</span>
                <span>Webhook Verification Tester</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">GET Handshake</span>
            </div>

            <p className="text-xs text-slate-400">
              Simulates Meta&apos;s webhook verification query to verify your verify token and challenge handler.
            </p>

            <button
              onClick={handleTestHandshake}
              disabled={handshakeStatus === 'TESTING'}
              className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {handshakeStatus === 'TESTING' ? (
                <>
                  <span className="animate-spin text-cyan-400">⚡</span>
                  <span>Verifying Handshake...</span>
                </>
              ) : (
                <>
                  <span>🧪</span>
                  <span>Run Webhook Handshake Verification Test</span>
                </>
              )}
            </button>

            {handshakeLog && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono whitespace-pre-line ${
                  handshakeStatus === 'SUCCESS'
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800 text-rose-200'
                }`}
              >
                {handshakeLog}
              </div>
            )}
          </div>

          {/* Inbound Event Receiver Simulator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>📩</span>
                <span>Inbound Webhook Event Simulator</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">POST Event</span>
            </div>

            <p className="text-xs text-slate-400">
              Simulate receiving a message event from Facebook Messenger user PSID.
            </p>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Sender User PSID
              </label>
              <input
                type="text"
                value={simulatedPsid}
                onChange={(e) => setSimulatedPsid(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Inbound Message Text
              </label>
              <input
                type="text"
                value={simulatedMessageText}
                onChange={(e) => setSimulatedMessageText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSimulateInboundMessage}
              className="w-full py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-mono text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              Simulate Inbound Webhook Event
            </button>

            {inboundLog && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-200 whitespace-pre-line">
                {inboundLog}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
