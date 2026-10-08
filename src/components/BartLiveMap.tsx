import React, { useState, useEffect, useRef } from 'react';
import { playKeyClick, playBeep } from '../utils/audio';

interface ActiveTrain {
  id: string;
  lineId: 'yellow' | 'red' | 'green' | 'orange' | 'blue';
  lineName: string;
  color: string;
  headsign: string;
  cars: number;
  speedMph: number;
  nearestStation: string;
  status: 'In Transit' | 'Boarding' | 'In Transbay Tube';
  t: number; // progress 0 to 1 along line track
  direction: 1 | -1;
}

// Track waypoints for the 5 lines across the schematic map (width 800, height 520)
// San Francisco spine: (300, 360) -> (310, 300) -> (320, 240) -> (330, 200) -> Transbay Tube: (340, 180) to (440, 170) -> East Bay Oakland: (460, 170)
const lineTracks: Record<string, { x: number; y: number; station: string }[]> = {
  yellow: [
    { x: 200, y: 440, station: 'Millbrae' },
    { x: 220, y: 400, station: 'SFO Airport' },
    { x: 250, y: 350, station: 'Daly City' },
    { x: 280, y: 310, station: '24th St Mission' },
    { x: 300, y: 260, station: 'Civic Center' },
    { x: 320, y: 230, station: 'Powell St' },
    { x: 340, y: 200, station: 'Montgomery St' },
    { x: 360, y: 175, station: 'Embarcadero' },
    // Transbay Tube
    { x: 440, y: 165, station: 'West Oakland' },
    { x: 480, y: 155, station: '12th St Oakland' },
    { x: 500, y: 140, station: 'MacArthur' },
    { x: 530, y: 120, station: 'Rockridge' },
    { x: 580, y: 100, station: 'Lafayette' },
    { x: 640, y: 85, station: 'Walnut Creek' },
    { x: 700, y: 70, station: 'Concord' },
    { x: 760, y: 55, station: 'Antioch' },
  ],
  red: [
    { x: 200, y: 440, station: 'Millbrae' },
    { x: 250, y: 350, station: 'Daly City' },
    { x: 300, y: 260, station: 'Civic Center' },
    { x: 340, y: 200, station: 'Montgomery St' },
    { x: 360, y: 175, station: 'Embarcadero' },
    // Transbay Tube
    { x: 440, y: 165, station: 'West Oakland' },
    { x: 480, y: 155, station: '12th St Oakland' },
    { x: 500, y: 140, station: 'MacArthur' },
    { x: 505, y: 105, station: 'Ashby' },
    { x: 510, y: 80, station: 'Downtown Berkeley' },
    { x: 510, y: 50, station: 'El Cerrito' },
    { x: 510, y: 25, station: 'Richmond' },
  ],
  green: [
    { x: 700, y: 460, station: 'Berryessa (San José)' },
    { x: 660, y: 410, station: 'Milpitas' },
    { x: 620, y: 360, station: 'Fremont' },
    { x: 580, y: 300, station: 'Hayward' },
    { x: 550, y: 250, station: 'San Leandro' },
    { x: 520, y: 215, station: 'Coliseum' },
    { x: 490, y: 185, station: 'Lake Merritt' },
    { x: 440, y: 165, station: 'West Oakland' },
    { x: 360, y: 175, station: 'Embarcadero' },
    { x: 320, y: 230, station: 'Powell St' },
    { x: 250, y: 350, station: 'Daly City' },
  ],
  orange: [
    { x: 510, y: 25, station: 'Richmond' },
    { x: 510, y: 80, station: 'Downtown Berkeley' },
    { x: 500, y: 140, station: 'MacArthur' },
    { x: 480, y: 155, station: '12th St Oakland' },
    { x: 490, y: 185, station: 'Lake Merritt' },
    { x: 520, y: 215, station: 'Coliseum' },
    { x: 550, y: 250, station: 'San Leandro' },
    { x: 580, y: 300, station: 'Hayward' },
    { x: 620, y: 360, station: 'Fremont' },
    { x: 660, y: 410, station: 'Milpitas' },
    { x: 700, y: 460, station: 'Berryessa (San José)' },
  ],
  blue: [
    { x: 740, y: 250, station: 'Dublin / Pleasanton' },
    { x: 680, y: 250, station: 'Castro Valley' },
    { x: 550, y: 250, station: 'Bay Fair' },
    { x: 520, y: 215, station: 'Coliseum' },
    { x: 490, y: 185, station: 'Lake Merritt' },
    { x: 440, y: 165, station: 'West Oakland' },
    { x: 360, y: 175, station: 'Embarcadero' },
    { x: 320, y: 230, station: 'Powell St' },
    { x: 250, y: 350, station: 'Daly City' },
  ],
};

// Initial simulated active trains roaming the network
const initialTrains: ActiveTrain[] = [
  {
    id: 'TR-102',
    lineId: 'yellow',
    lineName: 'Yellow Line',
    color: '#facc15',
    headsign: 'SFO Airport',
    cars: 10,
    speedMph: 68,
    nearestStation: 'Transbay Tube (SF Bound)',
    status: 'In Transbay Tube',
    t: 0.45,
    direction: -1,
  },
  {
    id: 'TR-108',
    lineId: 'yellow',
    lineName: 'Yellow Line',
    color: '#facc15',
    headsign: 'Antioch',
    cars: 10,
    speedMph: 55,
    nearestStation: 'Walnut Creek',
    status: 'In Transit',
    t: 0.82,
    direction: 1,
  },
  {
    id: 'TR-204',
    lineId: 'red',
    lineName: 'Red Line',
    color: '#ef4444',
    headsign: 'Richmond',
    cars: 8,
    speedMph: 45,
    nearestStation: 'Downtown Berkeley',
    status: 'In Transit',
    t: 0.75,
    direction: 1,
  },
  {
    id: 'TR-211',
    lineId: 'red',
    lineName: 'Red Line',
    color: '#ef4444',
    headsign: 'Millbrae',
    cars: 10,
    speedMph: 0,
    nearestStation: 'Montgomery St',
    status: 'Boarding',
    t: 0.38,
    direction: -1,
  },
  {
    id: 'TR-305',
    lineId: 'green',
    lineName: 'Green Line',
    color: '#22c55e',
    headsign: 'Berryessa (San José)',
    cars: 8,
    speedMph: 62,
    nearestStation: 'Fremont',
    status: 'In Transit',
    t: 0.28,
    direction: -1,
  },
  {
    id: 'TR-312',
    lineId: 'green',
    lineName: 'Green Line',
    color: '#22c55e',
    headsign: 'Daly City',
    cars: 8,
    speedMph: 52,
    nearestStation: 'Coliseum',
    status: 'In Transit',
    t: 0.55,
    direction: 1,
  },
  {
    id: 'TR-401',
    lineId: 'orange',
    lineName: 'Orange Line',
    color: '#f97316',
    headsign: 'Berryessa (San José)',
    cars: 8,
    speedMph: 40,
    nearestStation: '12th St Oakland',
    status: 'In Transit',
    t: 0.35,
    direction: 1,
  },
  {
    id: 'TR-502',
    lineId: 'blue',
    lineName: 'Blue Line',
    color: '#3b82f6',
    headsign: 'Dublin / Pleasanton',
    cars: 8,
    speedMph: 65,
    nearestStation: 'Castro Valley',
    status: 'In Transit',
    t: 0.22,
    direction: -1,
  },
];

// Helper to compute (x, y) along a piecewise linear track
function getPointOnTrack(track: { x: number; y: number; station: string }[], t: number) {
  if (t <= 0) return { x: track[0].x, y: track[0].y, station: track[0].station };
  if (t >= 1) return { x: track[track.length - 1].x, y: track[track.length - 1].y, station: track[track.length - 1].station };

  const totalSegments = track.length - 1;
  const segment = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
  const localT = (t * totalSegments) - segment;

  const p1 = track[segment];
  const p2 = track[segment + 1];

  return {
    x: p1.x + (p2.x - p1.x) * localT,
    y: p1.y + (p2.y - p1.y) * localT,
    station: localT > 0.5 ? p2.station : p1.station,
  };
}

export const BartLiveMap: React.FC = () => {
  const [trains, setTrains] = useState<ActiveTrain[]>(initialTrains);
  const [selectedTrain, setSelectedTrain] = useState<ActiveTrain | null>(null);
  const [filterLine, setFilterLine] = useState<string>('all');
  const animFrameRef = useRef<number | null>(null);

  // Smooth live train movement simulation
  useEffect(() => {
    let lastTime = performance.now();

    const updateLoop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTrains((prevTrains) =>
        prevTrains.map((train) => {
          const track = lineTracks[train.lineId];
          const speedFactor = 0.025; // cycle speed
          let nextT = train.t + train.direction * speedFactor * dt;

          let nextDirection = train.direction;
          if (nextT >= 1) {
            nextT = 1;
            nextDirection = -1;
          } else if (nextT <= 0) {
            nextT = 0;
            nextDirection = 1;
          }

          const point = getPointOnTrack(track, nextT);

          // Calculate status based on segment
          let status: 'In Transit' | 'Boarding' | 'In Transbay Tube' = 'In Transit';
          let speedMph = 55;

          if (point.x >= 360 && point.x <= 440 && point.y >= 160 && point.y <= 180) {
            status = 'In Transbay Tube';
            speedMph = 70;
          } else if (Math.sin(nextT * 30) > 0.88) {
            status = 'Boarding';
            speedMph = 0;
          }

          return {
            ...train,
            t: nextT,
            direction: nextDirection,
            nearestStation: point.station,
            status,
            speedMph,
          };
        })
      );

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const filteredTrains =
    filterLine === 'all' ? trains : trains.filter((t) => t.lineId === filterLine);

  return (
    <div className="space-y-6 font-sans">
      {/* Map Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live Fleet Telemetry
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Active Train Positions &amp; Transbay Grid
          </h3>
        </div>

        {/* Line Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/60 border border-slate-800 rounded-xl">
          <button
            onClick={() => {
              playKeyClick();
              setFilterLine('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              filterLine === 'all' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL ({trains.length})
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setFilterLine('yellow');
            }}
            className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              filterLine === 'yellow' ? 'bg-yellow-400 text-slate-950 font-bold' : 'text-yellow-400 hover:bg-yellow-950/40'
            }`}
          >
            YELLOW
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setFilterLine('red');
            }}
            className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              filterLine === 'red' ? 'bg-red-500 text-white font-bold' : 'text-red-400 hover:bg-red-950/40'
            }`}
          >
            RED
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setFilterLine('green');
            }}
            className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              filterLine === 'green' ? 'bg-green-500 text-slate-950 font-bold' : 'text-green-400 hover:bg-green-950/40'
            }`}
          >
            GREEN
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setFilterLine('orange');
            }}
            className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              filterLine === 'orange' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-orange-400 hover:bg-orange-950/40'
            }`}
          >
            ORANGE
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setFilterLine('blue');
            }}
            className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              filterLine === 'blue' ? 'bg-blue-500 text-white font-bold' : 'text-blue-400 hover:bg-blue-950/40'
            }`}
          >
            BLUE
          </button>
        </div>
      </div>

      {/* SVG Canvas Map Display */}
      <div className="relative border-2 border-slate-800 bg-[#060c09] rounded-2xl p-2 sm:p-4 overflow-hidden shadow-2xl">
        {/* Background San Francisco Bay Silhouette Label */}
        <div className="absolute top-6 left-6 pointer-events-none text-[11px] font-mono text-slate-600 space-y-1">
          <div>SAN FRANCISCO BAY AREA</div>
          <div className="text-[10px] text-slate-700">SCALE: SCHEMATIC TRANSIT MAP</div>
        </div>

        {/* Transbay Tube Label */}
        <div className="absolute top-[34%] left-[45%] pointer-events-none text-[10px] font-mono text-cyan-400/70 border border-cyan-800/40 bg-cyan-950/40 px-2 py-0.5 rounded">
          TRANSBAY TUBE ≋
        </div>

        <svg
          viewBox="0 0 800 500"
          className="w-full h-auto min-h-[360px] max-h-[560px] select-none"
        >
          <defs>
            {/* Glow filters for tracks and train nodes */}
            <filter id="trainGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Transbay Water Pattern */}
            <pattern id="bayWater" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0 5 Q 2.5 2, 5 5 T 10 5" fill="none" stroke="#0e231e" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* San Francisco Bay Water Area */}
          <ellipse cx="400" cy="250" rx="90" ry="160" fill="url(#bayWater)" opacity="0.6" />

          {/* Transbay Underwater Tube Connector dashed line */}
          <line
            x1="360"
            y1="175"
            x2="440"
            y2="165"
            stroke="#00e5ff"
            strokeWidth="5"
            strokeDasharray="4 3"
            opacity="0.7"
          />

          {/* Line Tracks */}
          {Object.entries(lineTracks).map(([lId, pts]) => {
            const isHighlighted = filterLine === 'all' || filterLine === lId;
            const strokeColor =
              lId === 'yellow'
                ? '#facc15'
                : lId === 'red'
                ? '#ef4444'
                : lId === 'green'
                ? '#22c55e'
                : lId === 'orange'
                ? '#f97316'
                : '#3b82f6';

            const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

            return (
              <g key={lId} opacity={isHighlighted ? 0.85 : 0.2} className="transition-opacity duration-300">
                {/* Outer Glow */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                />
                {/* Main Line Rail */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Station Dots */}
                {pts.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    fill="#0a120c"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            );
          })}

          {/* Key Station Labels */}
          <g fontSize="10" fontFamily="monospace" fill="#94a3b8">
            <text x="350" y="160" textAnchor="end" fill="#ffffff" fontWeight="bold">Embarcadero</text>
            <text x="310" y="220" textAnchor="end">Powell St</text>
            <text x="270" y="300" textAnchor="end">24th St Mission</text>
            <text x="210" y="390" textAnchor="end" fill="#38bdf8">SFO Airport ✈</text>
            <text x="445" y="150" textAnchor="start" fill="#ffffff" fontWeight="bold">West Oakland</text>
            <text x="505" y="130" textAnchor="start">MacArthur</text>
            <text x="515" y="75" textAnchor="start">Downtown Berkeley</text>
            <text x="515" y="20" textAnchor="start">Richmond</text>
            <text x="765" y="50" textAnchor="middle" fill="#facc15">Antioch</text>
            <text x="745" y="245" textAnchor="start" fill="#60a5fa">Dublin</text>
            <text x="705" y="475" textAnchor="start" fill="#4ade80">Berryessa (San José)</text>
          </g>

          {/* Dynamic Active Trains Moving along Tracks */}
          {filteredTrains.map((train) => {
            const track = lineTracks[train.lineId];
            const pt = getPointOnTrack(track, train.t);
            const isSelected = selectedTrain?.id === train.id;

            return (
              <g
                key={train.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                onClick={() => {
                  playBeep(740, 0.05);
                  setSelectedTrain(train);
                }}
                className="cursor-pointer group"
              >
                {/* Pulse Ring when in transit or selected */}
                <circle
                  r={isSelected ? '14' : '10'}
                  fill="none"
                  stroke={train.color}
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
                  stroke={train.color}
                  strokeWidth={isSelected ? '2.5' : '1.8'}
                  filter="url(#trainGlow)"
                />

                {/* Iconic Train Front SVG Graphic */}
                <path
                  d="M-6 -6 H6 V2 Q6 6 0 6 Q-6 6 -6 2 Z"
                  fill={train.color}
                />
                {/* Windshield */}
                <rect x="-4" y="-4" width="8" height="4" rx="1" fill="#040805" />
                {/* Twin Headlights */}
                <circle cx="-3" cy="2" r="1" fill="#ffffff" />
                <circle cx="3" cy="2" r="1" fill="#ffffff" />

                {/* Train ID Tag Floating Above */}
                <text
                  x="0"
                  y="-16"
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#ffffff"
                  className="bg-black drop-shadow-md"
                >
                  {train.id}
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
                style={{ backgroundColor: selectedTrain.color }}
              />
              <div>
                <div className="text-white font-bold text-sm">
                  Train #{selectedTrain.id} &bull; {selectedTrain.lineName}
                </div>
                <div className="text-slate-400">
                  Headsign: <strong className="text-white">{selectedTrain.headsign}</strong> &bull; {selectedTrain.cars} cars
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400">POSITION:</span>{' '}
                <span className="text-emerald-400 font-bold">{selectedTrain.nearestStation}</span>
              </div>
              <div>
                <span className="text-slate-400">SPEED:</span>{' '}
                <span className="text-white font-bold">{selectedTrain.speedMph} mph</span>
              </div>
              <button
                onClick={() => setSelectedTrain(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live System Fleet Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">TRACKED TRAINS</span>
          <span className="text-lg font-bold text-emerald-400">{trains.length} Active Consists</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">TRANSBAY TRAFFIC</span>
          <span className="text-lg font-bold text-cyan-400">Underway (70 mph)</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">SYSTEM HEADWAYS</span>
          <span className="text-lg font-bold text-yellow-400">3 - 5 min peak</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-400 text-[11px] block">ON-TIME PERFORMANCE</span>
          <span className="text-lg font-bold text-white">96.8%</span>
        </div>
      </div>
    </div>
  );
};
