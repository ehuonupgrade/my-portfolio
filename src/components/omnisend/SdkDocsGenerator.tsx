import React, { useState } from 'react';
import { ClientApp } from '../../types/messaging';

interface SdkDocsGeneratorProps {
  clientApps: ClientApp[];
}

export const SdkDocsGenerator: React.FC<SdkDocsGeneratorProps> = ({ clientApps }) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(clientApps[0]?.id || 'edgedetect-app');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'node' | 'python' | 'react'>(
    'curl'
  );
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const activeApp = clientApps.find((a) => a.id === selectedAppId) || clientApps[0];
  const apiKey = activeApp?.apiKey || 'omni_live_your_api_key_here';

  const hostUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-dev-qmmfaqnqi7dy6nk7jzyg5v-725293774623.us-east1.run.app';

  const snippets = {
    curl: `curl -X POST "${hostUrl}/api/v1/messages/send" \\
  -H "Content-Type: application/json" \\
  -H "X-OmniSend-App-Id: ${activeApp?.id || 'edgedetect-app'}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "appId": "${activeApp?.id || 'edgedetect-app'}",
    "channel": "facebook_messenger",
    "recipientId": "psid_781920384756",
    "content": {
      "title": "🔥 WHALE DIVERGENCE ALERT",
      "text": "Bears -3.0 line steam detected. 79% handle inflow.",
      "mediaUrl": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
      "buttons": [
        {
          "title": "View Live Board",
          "payloadOrUrl": "https://huon.si/myprojects/edgedetect",
          "type": "web_url"
        }
      ]
    }
  }'`,

    node: `import fetch from 'node-fetch';

async function dispatchOmniSendNotification() {
  const response = await fetch('${hostUrl}/api/v1/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-OmniSend-App-Id': '${activeApp?.id || 'edgedetect-app'}',
      'Authorization': 'Bearer ${apiKey}'
    },
    body: JSON.stringify({
      appId: '${activeApp?.id || 'edgedetect-app'}',
      channel: 'facebook_messenger',
      recipientId: 'psid_781920384756',
      content: {
        title: '🔥 WHALE DIVERGENCE ALERT',
        text: 'Bears -3.0 line steam detected.',
        buttons: [
          {
            title: 'View Board',
            payloadOrUrl: 'https://huon.si/myprojects/edgedetect',
            type: 'web_url'
          }
        ]
      }
    })
  });

  const result = await response.json();
}

dispatchOmniSendNotification();`,

    python: `import requests

url = "${hostUrl}/api/v1/messages/send"
headers = {
    "Content-Type": "application/json",
    "X-OmniSend-App-Id": "${activeApp?.id || 'edgedetect-app'}",
    "Authorization": "Bearer ${apiKey}"
}

payload = {
    "appId": "${activeApp?.id || 'edgedetect-app'}",
    "channel": "facebook_messenger",
    "recipientId": "psid_781920384756",
    "content": {
        "title": "🔥 WHALE DIVERGENCE ALERT",
        "text": "Bears -3.0 line steam detected.",
        "buttons": [
            {
                "title": "View Live Board",
                "payloadOrUrl": "https://huon.si/myprojects/edgedetect",
                "type": "web_url"
            }
        ]
    }
}

response = requests.post(url, json=payload, headers=headers)
print("Response:", response.json())`,

    react: `import React, { useState } from 'react';

export const OmniSendButton = () => {
  const [sending, setSending] = useState(false);

  const sendAlert = async () => {
    setSending(true);
    try {
      const res = await fetch('${hostUrl}/api/v1/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OmniSend-App-Id': '${activeApp?.id || 'edgedetect-app'}',
          'Authorization': 'Bearer ${apiKey}'
        },
        body: JSON.stringify({
          appId: '${activeApp?.id || 'edgedetect-app'}',
          channel: 'facebook_messenger',
          recipientId: 'psid_781920384756',
          content: {
            title: '⚡ 1-Tap Trigger Notification',
            text: 'Alert sent directly from React application UI.'
          }
        })
      });
      const data = await res.json();
      alert('Alert Dispatched: ' + JSON.stringify(data));
    } finally {
      setSending(false);
    }
  };

  return (
    <button onClick={sendAlert} disabled={sending}>
      {sending ? 'Sending...' : 'Dispatch Alert'}
    </button>
  );
};`,
  };

  const codeText = snippets[selectedLanguage];

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-0.5">
            <span>SDK &amp; INTEGRATION CODE GENERATOR</span>
            <span>·</span>
            <span>REST API SPECS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Connect Any Application to OmniSend Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Auto-generated cURL, Node.js, Python, and React SDK snippets tailored to your client app.
          </p>
        </div>

        {/* Client App Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400 shrink-0">Client App:</label>
          <select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            {clientApps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Code Snippet Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        {/* Language Tabs & Copy Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5">
            {(['curl', 'node', 'python', 'react'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs cursor-pointer transition-colors ${
                  selectedLanguage === lang
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'curl'
                  ? 'cURL'
                  : lang === 'node'
                  ? 'Node.js (Fetch)'
                  : lang === 'python'
                  ? 'Python (Requests)'
                  : 'React SDK'}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <span>{copiedCode ? 'Copied! ✓' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code View */}
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
          {codeText}
        </pre>
      </div>
    </div>
  );
};
