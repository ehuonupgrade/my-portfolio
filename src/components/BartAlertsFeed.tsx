import React, { useState, useEffect } from 'react';
import { playKeyClick, playSuccessChime } from '../utils/audio';

interface ServiceAdvisory {
  id: string;
  station: string;
  type: string;
  description: string;
  smsText: string;
  posted: string;
}

export const BartAlertsFeed: React.FC = () => {
  const [activeAccount, setActiveAccount] = useState<'SFBARTalert' | 'SFBART'>('SFBARTalert');
  const [advisories, setAdvisories] = useState<ServiceAdvisory[]>([]);
  const [loadingBsa, setLoadingBsa] = useState<boolean>(true);

  // Fetch official real-time BSA (BART Service Advisories)
  useEffect(() => {
    let isMounted = true;
    setLoadingBsa(true);

    fetch('https://api.bart.gov/api/bsa.aspx?cmd=bsa&key=MW9S-E7SL-26DU-VV8V&json=y')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const bsaList = data?.root?.bsa;
        if (bsaList) {
          const list = Array.isArray(bsaList) ? bsaList : [bsaList];
          const parsed = list.map((b: any, idx: number) => ({
            id: b['@id'] || `bsa-${idx}`,
            station: b.station || 'BART Systemwide',
            type: b.type || 'ADVISORY',
            description: b.description?.['#cdata-section'] || b.description || 'Service alert in effect.',
            smsText: b.sms_text?.['#cdata-section'] || b.sms_text || '',
            posted: b.posted || 'Recently posted',
          }));
          setAdvisories(parsed);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch BART BSA advisories:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingBsa(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Inject or reload Twitter/X widgets script
  useEffect(() => {
    const scriptId = 'twitter-wjs';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);
    } else if ((window as any).twttr?.widgets) {
      (window as any).twttr.widgets.load();
    }
  }, [activeAccount]);

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Header & Account Toggle */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Public Transit Dispatch &bull; X.com Feeds
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mt-1">
              BART Service Alerts &amp; Communications
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking real-time delays, track maintenance, elevator outages, and emergency service updates.
            </p>
          </div>

          {/* Account Selector Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                playKeyClick();
                setActiveAccount('SFBARTalert');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                activeAccount === 'SFBARTalert'
                  ? 'bg-red-500 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              @SFBARTalert
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setActiveAccount('SFBART');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                activeAccount === 'SFBART'
                  ? 'bg-blue-500 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              @SFBART
            </button>
          </div>
        </div>

        {/* Live Official BART BSA Bulletins */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase">Live BART Advisory Wire:</span>
            <span className="text-emerald-400">
              {loadingBsa ? 'Fetching advisories...' : `${advisories.length} Active Bulletin(s)`}
            </span>
          </div>

          {advisories.length > 0 ? (
            <div className="space-y-2">
              {advisories.map((advisory) => (
                <div
                  key={advisory.id}
                  className="p-4 rounded-xl bg-red-950/30 border border-red-900/60 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-red-400">
                    <span className="font-bold px-2 py-0.5 rounded bg-red-950 border border-red-800">
                      ⚠️ {advisory.type}
                    </span>
                    <span>{advisory.posted}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {advisory.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/60 text-xs text-emerald-300 font-mono">
              ✓ No systemwide emergency delays currently reported. Regular service in effect.
            </div>
          )}
        </div>
      </div>

      {/* Embedded X.com Feed Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Account Profile & Direct Action */}
        <div className="md:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black border border-slate-700 flex items-center justify-center font-bold text-white text-base">
                𝕏
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {activeAccount === 'SFBARTalert' ? 'BART Service Alerts' : 'Official BART'}
                </h4>
                <a
                  href={`https://x.com/${activeAccount}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 font-mono hover:underline"
                >
                  @{activeAccount}
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeAccount === 'SFBARTalert'
                ? 'Automated real-time service disruptions, train delays, track holds, medical emergencies, and elevator status across all BART stations.'
                : 'Official news, system improvements, general announcements, and transit agency communications from the Bay Area Rapid Transit District.'}
            </p>

            <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
              <a
                href={`https://x.com/${activeAccount}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-medium text-xs text-center transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Live Feed on X.com</span>
                <span>↗</span>
              </a>
              <a
                href="https://x.com/SFBARTalert"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-slate-400 hover:text-slate-200 text-center"
              >
                Direct: x.com/SFBARTalert
              </a>
            </div>
          </div>

          {/* Quick Helpline Box */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 text-xs font-mono space-y-1 text-slate-400">
            <span className="text-white font-bold block">BART Police Dispatch</span>
            <div>Emergency: (510) 464-7000</div>
            <div>BART Watch App: Report discreetly</div>
          </div>
        </div>

        {/* Right Column: Live X Feed Widget */}
        <div className="md:col-span-8">
          <div className="border border-slate-800 rounded-2xl bg-slate-950/80 p-4 sm:p-5 min-h-[500px] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span>LIVE TIMELINE STREAM</span>
              <span className="text-cyan-400 font-bold">@{activeAccount}</span>
            </div>

            {/* Embedded Twitter Timeline Link (rendered by widgets.js) */}
            <div className="pt-4 max-h-[600px] overflow-y-auto">
              {activeAccount === 'SFBARTalert' ? (
                <a
                  className="twitter-timeline"
                  data-theme="dark"
                  data-chrome="noheader nofooter transparent noborders"
                  data-tweet-limit="5"
                  href="https://twitter.com/SFBARTalert?ref_src=twsrc%5Etfw"
                >
                  Loading live tweets from @SFBARTalert...
                </a>
              ) : (
                <a
                  className="twitter-timeline"
                  data-theme="dark"
                  data-chrome="noheader nofooter transparent noborders"
                  data-tweet-limit="5"
                  href="https://twitter.com/SFBART?ref_src=twsrc%5Etfw"
                >
                  Loading live tweets from @SFBART...
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
