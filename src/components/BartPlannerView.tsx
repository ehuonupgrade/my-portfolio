import React, { useState, useMemo } from 'react';
import bartData from '../data/bart_data.json';
import { BartLiveMap } from './BartLiveMap';
import { playKeyClick, playSuccessChime } from '../utils/audio';

interface BartPlannerViewProps {
  onBack?: () => void;
}

export const BartPlannerView: React.FC<BartPlannerViewProps> = ({ onBack }) => {
  const [originCode, setOriginCode] = useState<string>('EMBR'); // Embarcadero
  const [destCode, setDestCode] = useState<string>('SFIA'); // SFO Airport
  const [activeTab, setActiveTab] = useState<'planner' | 'map' | 'lines' | 'api'>('planner');

  const { stations, lines, systemStatus } = bartData;

  const originStation = stations.find((s) => s.code === originCode) || stations[0];
  const destStation = stations.find((s) => s.code === destCode) || stations[12];

  // Quick route presets
  const handleSelectPreset = (orig: string, dest: string) => {
    playKeyClick();
    setOriginCode(orig);
    setDestCode(dest);
  };

  const handleSwapStations = () => {
    playKeyClick();
    const temp = originCode;
    setOriginCode(destCode);
    setDestCode(temp);
  };

  // Route calculation logic
  const routeCalculation = useMemo(() => {
    if (originCode === destCode) {
      return {
        isSame: true,
        directLines: [],
        durationMins: 0,
        fareClipper: '$0.00',
        departures: [],
        transferRequired: false,
        transferStation: null,
      };
    }

    // Check for direct line connections
    const sharedLines = originStation.lines.filter((lineId) =>
      destStation.lines.includes(lineId)
    );

    const directLines = lines.filter((l) => sharedLines.includes(l.id));

    // Calculate approximate trip time based on synthetic distance
    const isTransbay =
      (originStation.city === 'San Francisco' && destStation.city !== 'San Francisco') ||
      (originStation.city !== 'San Francisco' && destStation.city === 'San Francisco');

    const isAirport = originCode === 'SFIA' || destCode === 'SFIA';

    let durationMins = 16;
    if (isAirport && isTransbay) durationMins = 44;
    else if (isAirport) durationMins = 32;
    else if (isTransbay) durationMins = 24;
    else durationMins = 18;

    let fareClipper = '$2.50';
    if (isAirport) fareClipper = '$10.55';
    else if (isTransbay) fareClipper = '$4.25';
    else fareClipper = '$2.50';

    // Upcoming departures simulation
    const now = new Date();
    const departures = [4, 16, 28].map((offset) => {
      const dep = new Date(now.getTime() + offset * 60000);
      const arr = new Date(dep.getTime() + durationMins * 60000);
      return {
        waitMins: offset,
        depTime: dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        arrTime: arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cars: offset === 4 ? '10-car Fleet of Future' : '8-car Fleet of Future',
        headsign: directLines.length > 0 ? destStation.name : 'Transfer Required',
      };
    });

    return {
      isSame: false,
      directLines,
      durationMins,
      fareClipper,
      departures,
      transferRequired: directLines.length === 0,
      transferStation: directLines.length === 0 ? 'MacArthur / 12th St Oakland' : null,
      isTransbay,
    };
  }, [originCode, destCode, originStation, destStation, lines]);

  return (
    <div className="space-y-8 font-sans animate-fadeIn">
      {/* Breadcrumb Navigation */}
      {onBack && (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <button
            onClick={() => {
              playKeyClick();
              onBack();
            }}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>&larr;</span>
            <span>My Projects</span>
          </button>
          <span>/</span>
          <span className="text-emerald-400 font-semibold">BART Planner</span>
        </div>
      )}

      {/* Project Header Banner */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 sm:p-7 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Bay Area Rapid Transit Engine
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              BART Schedule Planner
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
              SERVICE: <strong className="text-emerald-400">{systemStatus.status}</strong>
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          Lightweight, high-speed transit schedule and trip route planner for the San Francisco Bay Area BART rail network. Real-time line tracking, fare calculation, and Transbay Tube crossing routes.
        </p>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('planner');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'planner'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            Trip Planner &amp; Schedule
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('map');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs'
                : 'text-emerald-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-emerald-900/60'
            }`}
          >
            <span>Live Map &amp; Train Positions</span>
            <span>🚆</span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('lines');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'lines'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            BART Line Directory
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('api');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'bg-white text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            Transit API Integration
          </button>
        </div>
      </div>

      {/* SECTION 1: TRIP PLANNER */}
      {activeTab === 'planner' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Route Preset Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Popular Routes:</span>
            <button
              onClick={() => handleSelectPreset('EMBR', 'SFIA')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
            >
              Embarcadero &rarr; SFO Airport
            </button>
            <button
              onClick={() => handleSelectPreset('12TH', 'POWL')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
            >
              Downtown Oakland &rarr; Powell St
            </button>
            <button
              onClick={() => handleSelectPreset('DBRK', 'MONT')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
            >
              Berkeley &rarr; Montgomery St
            </button>
            <button
              onClick={() => handleSelectPreset('BERY', 'EMBR')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
            >
              San José (Berryessa) &rarr; SF
            </button>
          </div>

          {/* Station Selector Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
              {/* Origin Station */}
              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold block">
                  Origin Station (Depart From)
                </label>
                <select
                  value={originCode}
                  onChange={(e) => {
                    playKeyClick();
                    setOriginCode(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:border-emerald-500 font-medium"
                >
                  {stations.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {originStation.lines.map((lId) => {
                    const l = lines.find((line) => line.id === lId);
                    return (
                      <span
                        key={lId}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${l?.bgColor} text-slate-950`}
                      >
                        {lId}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                <button
                  onClick={handleSwapStations}
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-transform hover:rotate-180 duration-300 cursor-pointer text-sm shadow-md"
                  title="Swap Origin and Destination"
                >
                  ⇄
                </button>
              </div>

              {/* Destination Station */}
              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold block">
                  Destination Station (Arrive At)
                </label>
                <select
                  value={destCode}
                  onChange={(e) => {
                    playKeyClick();
                    setDestCode(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:border-cyan-500 font-medium"
                >
                  {stations.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {destStation.lines.map((lId) => {
                    const l = lines.find((line) => line.id === lId);
                    return (
                      <span
                        key={lId}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${l?.bgColor} text-slate-950`}
                      >
                        {lId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Trip Summary & Departures Results */}
          {!routeCalculation.isSame ? (
            <div className="space-y-6">
              {/* Trip Metrics Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Trip Time</span>
                  <div className="text-xl font-bold text-white font-mono">
                    ~{routeCalculation.durationMins} min
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Clipper Fare</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    {routeCalculation.fareClipper}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Route Type</span>
                  <div className="text-sm font-bold text-white pt-1">
                    {routeCalculation.directLines.length > 0 ? 'Direct Train' : '1 Transfer'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Transbay Tube</span>
                  <div className="text-sm font-bold text-white pt-1">
                    {routeCalculation.isTransbay ? 'Yes (Under Bay)' : 'East/West Bay Only'}
                  </div>
                </div>
              </div>

              {/* Direct Lines Available */}
              {routeCalculation.directLines.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">Direct Service Via:</span>
                  {routeCalculation.directLines.map((l) => (
                    <span
                      key={l.id}
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-lg ${l.bgColor} text-slate-950 flex items-center gap-1.5 shadow-xs`}
                    >
                      <span>●</span>
                      <span>{l.name}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Transfer Warning if applicable */}
              {routeCalculation.transferRequired && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs space-y-1">
                  <strong className="font-semibold">Transfer Required:</strong> Take the train to{' '}
                  <span className="underline font-bold text-white">
                    {routeCalculation.transferStation}
                  </span>{' '}
                  and switch across the platform to your connecting line.
                </div>
              )}

              {/* Upcoming Scheduled Departures List */}
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Next Available Departures</h3>
                  <span className="text-xs font-mono text-emerald-400">LIVE ESTIMATES</span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {routeCalculation.departures.map((dep, idx) => (
                    <div
                      key={idx}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-16 font-mono font-bold text-base text-white">
                          in {dep.waitMins} min
                        </span>
                        <div className="space-y-0.5">
                          <div className="text-slate-200 font-semibold">
                            Departs {dep.depTime} &rarr; Arrives {dep.arrTime}
                          </div>
                          <div className="text-slate-400 text-[11px]">{dep.cars}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono text-[11px]">
                          ON TIME
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl text-xs">
              Origin and destination stations are the same. Please choose two different stations to calculate your route.
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: LIVE SYSTEM MAP & MOVING TRAIN POSITIONS */}
      {activeTab === 'map' && <BartLiveMap />}

      {/* SECTION 3: BART LINE DIRECTORY */}
      {activeTab === 'lines' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Active BART Transit Lines</h3>
            <p className="text-xs text-slate-400 mt-1">
              5 primary color-coded rail corridors connecting San Francisco, Oakland, Berkeley, SFO, and Silicon Valley.
            </p>
          </div>

          <div className="space-y-4">
            {lines.map((l) => (
              <div
                key={l.id}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${l.bgColor}`} />
                    <h4 className="text-base font-bold text-white">{l.name}</h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {l.stations.length} STATIONS
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {l.stations.map((code) => {
                    const st = stations.find((s) => s.code === code);
                    return (
                      <span
                        key={code}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800/80 text-slate-300 font-mono text-[11px]"
                      >
                        {st ? st.name : code}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: API INTEGRATION */}
      {activeTab === 'api' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">BART Open Data &amp; Real-Time API</h3>
            <p className="text-xs text-slate-400 mt-1">
              Official Bay Area Rapid Transit GTFS and REST APIs available for open integration.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4 text-xs text-slate-300 leading-relaxed">
            <h4 className="text-sm font-bold text-white">Live Endpoint Example</h4>
            <p>
              BART provides real-time estimated departures (ETD) with zero billing required using their public demo API key:
            </p>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              GET https://api.bart.gov/api/etd.aspx?cmd=etd&amp;orig=EMBR&amp;key=MW9S-E7SL-26DU-VV8V&amp;json=y
            </div>

            <ul className="space-y-1.5 pl-4 list-disc text-slate-400">
              <li>Includes real-time train length, minutes to arrival, and platform numbers.</li>
              <li>Supports Transbay Tube delay alerts and elevator service advisories.</li>
              <li>Ready to connect directly into web workers or edge API proxies.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
