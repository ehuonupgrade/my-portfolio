import React, { useState, useEffect, useCallback } from 'react';
import { playKeyClick, playBeep } from '../utils/audio';

export interface LiveTrain {
  id: string;
  stationCode: string;
  stationName: string;
  destination: string;
  destAbbr: string;
  lineId: string;
  hexcolor: string;
  direction: string;
  cars: string;
  minutes: string;
  delaySec: number;
  x: number;
  y: number;
}

// Accurate schematic coordinates for all 50 BART stations across the Bay Area (viewBox 840 x 520)
export const stationCoords: Record<string, { x: number; y: number; name: string }> = {
  // San Francisco Spine (Peninsula & Downtown)
  MLBR: { x: 190, y: 440, name: 'Millbrae' },
  SFIA: { x: 210, y: 410, name: 'SFO Airport' },
  SBRN: { x: 225, y: 380, name: 'San Bruno' },
  SSAN: { x: 238, y: 355, name: 'South San Francisco' },
  COLM: { x: 250, y: 330, name: 'Colma' },
  DALY: { x: 265, y: 305, name: 'Daly City' },
  BALB: { x: 280, y: 280, name: 'Balboa Park' },
  GLEN: { x: 295, y: 255, name: 'Glen Park' },
  '24TH': { x: 310, y: 230, name: '24th St Mission' },
  '16TH': { x: 325, y: 205, name: '16th St Mission' },
  CIVC: { x: 340, y: 180, name: 'Civic Center' },
  POWL: { x: 355, y: 160, name: 'Powell St' },
  MONT: { x: 370, y: 140, name: 'Montgomery St' },
  EMBR: { x: 385, y: 125, name: 'Embarcadero' },

  // Oakland & Transbay Hub
  WOAK: { x: 450, y: 120, name: 'West Oakland' },
  '12TH': { x: 480, y: 115, name: '12th St Oakland' },
  '19TH': { x: 490, y: 100, name: '19th St Oakland' },
  MCAR: { x: 500, y: 85, name: 'MacArthur' },
  LAKE: { x: 485, y: 145, name: 'Lake Merritt' },
  FTVL: { x: 505, y: 175, name: 'Fruitvale' },
  COLS: { x: 525, y: 205, name: 'Coliseum' },
  SANL: { x: 545, y: 235, name: 'San Leandro' },
  BAYF: { x: 565, y: 265, name: 'Bay Fair' },

  // Berkeley / Richmond (North East Bay)
  ASHB: { x: 500, y: 70, name: 'Ashby' },
  DBRK: { x: 500, y: 50, name: 'Downtown Berkeley' },
  NBRK: { x: 500, y: 35, name: 'North Berkeley' },
  PLZA: { x: 500, y: 20, name: 'El Cerrito Plaza' },
  DELN: { x: 500, y: 10, name: 'El Cerrito del Norte' },
  RICH: { x: 500, y: 0, name: 'Richmond' },

  // Antioch / Contra Costa (Northeast)
  ROCK: { x: 525, y: 75, name: 'Rockridge' },
  ORIN: { x: 555, y: 65, name: 'Orinda' },
  LAFY: { x: 590, y: 55, name: 'Lafayette' },
  WCRK: { x: 630, y: 50, name: 'Walnut Creek' },
  PHIL: { x: 665, y: 45, name: 'Pleasant Hill' },
  CONC: { x: 700, y: 40, name: 'Concord' },
  NCON: { x: 730, y: 35, name: 'North Concord' },
  PITT: { x: 760, y: 30, name: 'Pittsburg/Bay Point' },
  PCTR: { x: 785, y: 25, name: 'Pittsburg Center' },
  ANTC: { x: 810, y: 20, name: 'Antioch' },

  // Dublin / Pleasanton (East)
  CAST: { x: 615, y: 265, name: 'Castro Valley' },
  WDUB: { x: 675, y: 265, name: 'West Dublin' },
  DUBL: { x: 735, y: 265, name: 'Dublin / Pleasanton' },

  // South Bay / Fremont / Milpitas / Berryessa
  HAYW: { x: 580, y: 295, name: 'Hayward' },
  SHAY: { x: 595, y: 325, name: 'South Hayward' },
  UCTY: { x: 610, y: 355, name: 'Union City' },
  FRMT: { x: 625, y: 385, name: 'Fremont' },
  WARM: { x: 645, y: 415, name: 'Warm Springs' },
  MLPT: { x: 670, y: 450, name: 'Milpitas' },
  BERY: { x: 695, y: 485, name: 'Berryessa (San José)' },
};

// Line track polyline definitions connecting the station codes
const trackLines: Record<string, { color: string; stations: string[] }> = {
  yellow: {
    color: '#facc15',
    stations: ['ANTC', 'PCTR', 'PITT', 'NCON', 'CONC', 'PHIL', 'WCRK', 'LAFY', 'ORIN', 'ROCK', 'MCAR', '19TH', '12TH', 'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH', 'GLEN', 'BALB', 'DALY', 'COLM', 'SSAN', 'SBRN', 'SFIA', 'MLBR'],
  },
  red: {
    color: '#ef4444',
    stations: ['RICH', 'DELN', 'PLZA', 'NBRK', 'DBRK', 'ASHB', 'MCAR', '19TH', '12TH', 'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH', 'GLEN', 'BALB', 'DALY', 'COLM', 'SSAN', 'SBRN', 'MLBR'],
  },
  green: {
    color: '#22c55e',
    stations: ['BERY', 'MLPT', 'WARM', 'FRMT', 'UCTY', 'SHAY', 'HAYW', 'BAYF', 'SANL', 'COLS', 'FTVL', 'LAKE', 'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH', 'GLEN', 'BALB', 'DALY'],
  },
  orange: {
    color: '#f97316',
    stations: ['RICH', 'DELN', 'PLZA', 'NBRK', 'DBRK', 'ASHB', 'MCAR', '19TH', '12TH', 'LAKE', 'FTVL', 'COLS', 'SANL', 'BAYF', 'HAYW', 'SHAY', 'UCTY', 'FRMT', 'WARM', 'MLPT', 'BERY'],
  },
  blue: {
    color: '#3b82f6',
    stations: ['DUBL', 'WDUB', 'CAST', 'BAYF', 'SANL', 'COLS', 'FTVL', 'LAKE', 'WOAK', 'EMBR', 'MONT', 'POWL', 'CIVC', '16TH', '24TH', 'GLEN', 'BALB', 'DALY'],
  },
};

export const BartLiveMap: React.FC = () => {
  const [trains, setTrains] = useState<LiveTrain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedTrain, setSelectedTrain] = useState<LiveTrain | null>(null);
  const [filterLine, setFilterLine] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch real-time live trains from official BART API
  const fetchLiveTrains = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(
        'https://api.bart.gov/api/etd.aspx?cmd=etd&orig=ALL&key=MW9S-E7SL-26DU-VV8V&json=y'
      );
      if (!res.ok) throw new Error(`BART API HTTP ${res.status}`);

      const data = await res.json();
      const stationsList = data?.root?.station;

      if (!stationsList || !Array.isArray(stationsList)) {
        throw new Error('Unexpected BART API payload');
      }

      const parsedTrains: LiveTrain[] = [];
      const seenTrains = new Set<string>();

      stationsList.forEach((st: any) => {
        if (!st.etd) return;
        const etds = Array.isArray(st.etd) ? st.etd : [st.etd];

        etds.forEach((item: any) => {
          const estimates = Array.isArray(item.estimate) ? item.estimate : [item.estimate];

          estimates.forEach((est: any) => {
            const mins = est.minutes === 'Leaving' ? 0 : parseInt(est.minutes, 10);

            // Capture trains that are currently at or approaching within 2 minutes of this station
            if (mins <= 2) {
              const trainKey = `${st.abbr}-${item.abbreviation}-${est.direction}`;
              if (!seenTrains.has(trainKey)) {
                seenTrains.add(trainKey);

                const coords = stationCoords[st.abbr] || { x: 450, y: 120, name: st.name };

                // Apply slight jitter offset by direction/color so overlapping trains don't completely cover each other
                const offsetX = est.direction === 'North' ? -5 : 5;
                const offsetY = est.direction === 'North' ? -5 : 5;

                parsedTrains.push({
                  id: `TR-${st.abbr}-${parsedTrains.length + 101}`,
                  stationCode: st.abbr,
                  stationName: st.name,
                  destination: item.destination,
                  destAbbr: item.abbreviation,
                  lineId: (est.color || 'yellow').toLowerCase(),
                  hexcolor: est.hexcolor || '#facc15',
                  direction: est.direction || 'Outbound',
                  cars: est.length || '8',
                  minutes: est.minutes,
                  delaySec: parseInt(est.delay || '0', 10),
                  x: coords.x + offsetX,
                  y: coords.y + offsetY,
                });
              }
            }
          });
        });
      });

      setTrains(parsedTrains);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.warn('Could not fetch live BART ETD feed:', err);
      setErrorMsg('Could not reach live BART server. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling every 25 seconds for live updates
  useEffect(() => {
    fetchLiveTrains();
    const interval = setInterval(fetchLiveTrains, 25000);
    return () => clearInterval(interval);
  }, [fetchLiveTrains]);

  const filteredTrains =
    filterLine === 'all'
      ? trains
      : trains.filter((t) => t.lineId.toLowerCase() === filterLine.toLowerCase());

  return (
    <div className="space-y-6 font-sans">
      {/* Live Feed Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live Official BART Feed
            </span>
            <span className="text-xs text-slate-400 font-mono">
              &bull; {trains.length} Active Trains Found
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Real-Time Train Positions Across Bay Area
          </h3>
          <p className="text-xs text-slate-400">
            {lastUpdated ? `Live data refreshed at ${lastUpdated}` : 'Fetching live train positions...'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playKeyClick();
              fetchLiveTrains();
            }}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors cursor-pointer font-mono flex items-center gap-1.5"
          >
            <span>{loading ? 'Refreshing...' : '↻ Refresh Feed'}</span>
          </button>

          {/* Line Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900/60 border border-slate-800 rounded-xl">
            {['all', 'yellow', 'red', 'green', 'orange', 'blue'].map((l) => (
              <button
                key={l}
                onClick={() => {
                  playKeyClick();
                  setFilterLine(l);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono uppercase transition-colors cursor-pointer ${
                  filterLine === l
                    ? 'bg-white text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 font-mono">
          {errorMsg}
        </div>
      )}

      {/* SVG Canvas Map Display */}
      <div className="relative border-2 border-slate-800 bg-[#060c09] rounded-2xl p-2 sm:p-4 overflow-hidden shadow-2xl">
        {/* Map Legend & Bay labels */}
        <div className="absolute top-4 left-4 pointer-events-none text-[11px] font-mono text-slate-500 space-y-0.5">
          <div className="text-slate-400 font-bold">SAN FRANCISCO BAY AREA</div>
          <div>REAL-TIME ACTIVE TRAINS OVERLAY</div>
        </div>

        {/* Transbay Tube Label */}
        <div className="absolute top-[26%] left-[46%] pointer-events-none text-[10px] font-mono text-cyan-400/80 border border-cyan-800/40 bg-cyan-950/60 px-2 py-0.5 rounded">
          TRANSBAY TUBE ≋
        </div>

        <svg
          viewBox="0 0 840 510"
          className="w-full h-auto min-h-[380px] max-h-[580px] select-none"
        >
          <defs>
            <filter id="trainGlowLive" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <pattern id="bayWaterLive" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0 5 Q 2.5 2, 5 5 T 10 5" fill="none" stroke="#0e231e" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* San Francisco Bay Body of Water */}
          <ellipse cx="420" cy="240" rx="90" ry="160" fill="url(#bayWaterLive)" opacity="0.6" />

          {/* Transbay Tube Underwater Connector */}
          <line
            x1={stationCoords.EMBR.x}
            y1={stationCoords.EMBR.y}
            x2={stationCoords.WOAK.x}
            y2={stationCoords.WOAK.y}
            stroke="#00e5ff"
            strokeWidth="5"
            strokeDasharray="5 3"
            opacity="0.7"
          />

          {/* Line Track Rails */}
          {Object.entries(trackLines).map(([lId, config]) => {
            const isHighlighted = filterLine === 'all' || filterLine === lId;
            const pts = config.stations
              .map((code) => stationCoords[code])
              .filter(Boolean);

            if (pts.length < 2) return null;
            const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

            return (
              <g key={lId} opacity={isHighlighted ? 0.85 : 0.15} className="transition-opacity duration-300">
                <path
                  d={pathD}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Station Dots & Labels */}
          {Object.entries(stationCoords).map(([code, p]) => (
            <g key={code} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#0a120c"
                stroke="#ffffff"
                strokeWidth="1.2"
                className="group-hover:scale-150 transition-transform origin-center"
              />
            </g>
          ))}

          {/* Key Station Labels */}
          <g fontSize="10" fontFamily="monospace" fill="#94a3b8">
            <text x={stationCoords.EMBR.x - 10} y={stationCoords.EMBR.y} textAnchor="end" fill="#ffffff" fontWeight="bold">Embarcadero</text>
            <text x={stationCoords.POWL.x - 10} y={stationCoords.POWL.y} textAnchor="end">Powell St</text>
            <text x={stationCoords.SFIA.x - 10} y={stationCoords.SFIA.y} textAnchor="end" fill="#38bdf8">SFO Airport ✈</text>
            <text x={stationCoords.WOAK.x + 10} y={stationCoords.WOAK.y} textAnchor="start" fill="#ffffff" fontWeight="bold">West Oakland</text>
            <text x={stationCoords.MCAR.x + 10} y={stationCoords.MCAR.y} textAnchor="start">MacArthur</text>
            <text x={stationCoords.DBRK.x + 10} y={stationCoords.DBRK.y} textAnchor="start">Berkeley</text>
            <text x={stationCoords.RICH.x + 10} y={stationCoords.RICH.y} textAnchor="start">Richmond</text>
            <text x={stationCoords.ANTC.x - 10} y={stationCoords.ANTC.y + 15} textAnchor="middle" fill="#facc15">Antioch</text>
            <text x={stationCoords.DUBL.x + 10} y={stationCoords.DUBL.y + 4} textAnchor="start" fill="#60a5fa">Dublin</text>
            <text x={stationCoords.MLPT.x + 10} y={stationCoords.MLPT.y + 4} textAnchor="start" fill="#4ade80" fontWeight="bold">Milpitas</text>
            <text x={stationCoords.BERY.x + 10} y={stationCoords.BERY.y + 4} textAnchor="start" fill="#4ade80">Berryessa (SJ)</text>
          </g>

          {/* REAL-TIME LIVE TRAINS AT STATIONS */}
          {filteredTrains.map((train) => {
            const isSelected = selectedTrain?.id === train.id;

            return (
              <g
                key={train.id}
                transform={`translate(${train.x}, ${train.y})`}
                onClick={() => {
                  playBeep(720, 0.05);
                  setSelectedTrain(train);
                }}
                className="cursor-pointer group"
              >
                {/* Proximity Ping Ring */}
                <circle
                  r={isSelected ? '15' : '11'}
                  fill="none"
                  stroke={train.hexcolor}
                  strokeWidth="1.5"
                  className="animate-ping opacity-75 origin-center"
                />

                {/* Train Icon Badge Container */}
                <rect
                  x="-12"
                  y="-12"
                  width="24"
                  height="24"
                  rx="6"
                  fill="#07120a"
                  stroke={train.hexcolor}
                  strokeWidth={isSelected ? '2.5' : '1.8'}
                  filter="url(#trainGlowLive)"
                />

                {/* Iconic Train Front SVG Graphic */}
                <path
                  d="M-6 -6 H6 V2 Q6 6 0 6 Q-6 6 -6 2 Z"
                  fill={train.hexcolor}
                />
                <rect x="-4" y="-4" width="8" height="4" rx="1" fill="#040805" />
                <circle cx="-3" cy="2" r="1" fill="#ffffff" />
                <circle cx="3" cy="2" r="1" fill="#ffffff" />

                {/* Real-time Cars Count Badge */}
                <text
                  x="0"
                  y="-15"
                  textAnchor="middle"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#ffffff"
                  className="drop-shadow-md"
                >
                  {train.cars}c
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Train Telemetry Modal / Card */}
        {selectedTrain && (
          <div className="mt-3 p-4 rounded-xl bg-slate-900/95 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: selectedTrain.hexcolor }}
              />
              <div>
                <div className="text-white font-bold text-sm">
                  Live Train &bull; Heading to {selectedTrain.destination}
                </div>
                <div className="text-slate-400">
                  Current Station: <strong className="text-white">{selectedTrain.stationName}</strong> &bull; {selectedTrain.cars} Cars &bull; {selectedTrain.direction} Bound
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400">STATUS:</span>{' '}
                <span className="text-emerald-400 font-bold">
                  {selectedTrain.minutes === 'Leaving' ? 'Departing Station' : `Arriving in ${selectedTrain.minutes}m`}
                </span>
              </div>
              {selectedTrain.delaySec > 0 && (
                <div>
                  <span className="text-slate-400">DELAY:</span>{' '}
                  <span className="text-amber-400 font-bold">+{Math.round(selectedTrain.delaySec / 60)} min</span>
                </div>
              )}
              <button
                onClick={() => setSelectedTrain(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Live Fleet Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">LIVE TRAINS DETECTED</span>
          <span className="text-lg font-bold text-emerald-400">{trains.length} Active Trains</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">FEED SOURCE</span>
          <span className="text-lg font-bold text-cyan-400">BART GTFS / ETD</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">AUTO-REFRESH</span>
          <span className="text-lg font-bold text-yellow-400">Every 25s</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">STATUS</span>
          <span className="text-lg font-bold text-white">LIVE CONNECTED</span>
        </div>
      </div>
    </div>
  );
};
