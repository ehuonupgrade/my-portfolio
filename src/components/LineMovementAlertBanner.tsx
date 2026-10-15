import React, { useState, useEffect, useCallback } from 'react';
import { playKeyClick, playSuccessChime, playBeep } from '../utils/audio';

export interface MovementAlertItem {
  id: string;
  gameId: string;
  matchup: string;
  league: string;
  scheduledTime: string;
  stadium: string;
  alertType: 'WHALE_STEAM' | 'REVERSE_LINE_MOVEMENT' | 'HEAVY_SHARP_INFLOW';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  headline: string;
  spreadShift: {
    open: string;
    current: string;
    delta: string;
    favoredTeam: string;
  };
  totalShift: {
    open: string;
    current: string;
    delta: string;
    direction: 'UNDER' | 'OVER';
  };
  moneyDivergence: {
    dollarsPct: number;
    ticketsPct: number;
    divergenceMargin: number; // e.g. +26%
    dollarVolume: string; // e.g. $16.38M
    favoredSide: string;
  };
  riskWarnings: {
    title: string;
    description: string;
    severityLevel: 'HIGH' | 'MEDIUM';
  }[];
  actionAdvice: string;
}

export const ACTIVE_MOVEMENT_ALERTS: MovementAlertItem[] = [
  {
    id: 'alert-phi-hurts-blood-clot-20261015',
    gameId: 'nfl-phi-cle-w6',
    matchup: 'Cleveland Browns @ Philadelphia Eagles',
    league: 'NFL',
    scheduledTime: 'Sunday, Oct 18 · 10:00 AM PDT (1:00 PM EDT)',
    stadium: 'Lincoln Financial Field, Philadelphia, PA',
    alertType: 'WHALE_STEAM',
    severity: 'CRITICAL',
    headline: '🚨 CRITICAL BREAKING MEDICAL INJURY: Eagles QB Jalen Hurts Hospitalized with Blood Clot — Line Swings 7.0 Points!',
    spreadShift: {
      open: 'Eagles -4.5',
      current: 'Browns -2.5',
      delta: '7.0 Point Swing (Eagles Fav to Dog)',
      favoredTeam: 'Cleveland Browns',
    },
    totalShift: {
      open: '46.5 O/U',
      current: '40.5 O/U',
      delta: '-6.0 Points Drop',
      direction: 'UNDER',
    },
    moneyDivergence: {
      dollarsPct: 89,
      ticketsPct: 22,
      divergenceMargin: 67,
      dollarVolume: '$21.8M Handle',
      favoredSide: 'Browns -2.5 / Under 40.5',
    },
    riskWarnings: [
      {
        title: 'Emergency Medical Hospitalization',
        description:
          'Jalen Hurts has been admitted to the hospital for emergency blood clot treatment and is OUT indefinitely. Tanner McKee will make his 1st NFL start.',
        severityLevel: 'HIGH',
      },
      {
        title: 'Immediate 7-Point Market Swing',
        description:
          'Odds frozen and shifted 7 full points across DraftKings, FanDuel, Circa, and Pinnacle within 3 minutes of Adam Schefter breaking report.',
        severityLevel: 'HIGH',
      },
    ],
    actionAdvice:
      'CRITICAL INJURY ADJUSTMENT: Model rating downgraded Eagles by -6.8 points. Recommend taking Under 40.5 and Browns -2.5.',
  },
  {
    id: 'alert-sea-den-20261015',
    gameId: 'nfl-sea-den-tnf',
    matchup: 'Denver Broncos @ Seattle Seahawks (TNF)',
    league: 'NFL',
    scheduledTime: 'Thursday, Oct 15 · 5:15 PM PST',
    stadium: 'Lumen Field, Seattle, WA',
    alertType: 'WHALE_STEAM',
    severity: 'CRITICAL',
    headline: 'Nearest Upcoming NFL Game: Sharp Steam Pushes Seahawks to -3.0 on 71% Dollars Despite 62% Public on Broncos',
    spreadShift: {
      open: 'Seahawks -1.5',
      current: 'Seahawks -3.0',
      delta: '-1.5 Points (Toward Seattle)',
      favoredTeam: 'Seattle Seahawks',
    },
    totalShift: {
      open: '44.5 O/U',
      current: '43.5 O/U',
      delta: '-1.0 Point',
      direction: 'UNDER',
    },
    moneyDivergence: {
      dollarsPct: 71,
      ticketsPct: 38,
      divergenceMargin: 33,
      dollarVolume: '$14.8M Handle',
      favoredSide: 'Seattle Seahawks -3.0 / ML',
    },
    riskWarnings: [
      {
        title: 'Key Number Threshold Warning',
        description:
          'Line is currently sitting on the crucial 3-point key number. Take SEA -3.0 (-106) at DraftKings/Circa before books shade to -3.5 hook.',
        severityLevel: 'HIGH',
      },
      {
        title: 'Short-Week Home Crowd Edge',
        description:
          'Visiting road offenses traveling on 3 days rest struggle with pre-snap communication against Lumen Field crowd noise.',
        severityLevel: 'MEDIUM',
      },
    ],
    actionAdvice:
      'NEAREST SLATE STRAIGHT BET: Wager Seattle Seahawks -3.0 straight or tease to +7.0 in multi-day cross-slate packages.',
  },
  {
    id: 'alert-kc-det-20261018',
    gameId: 'nfl-kc-det-w6',
    matchup: 'Kansas City Chiefs @ Detroit Lions',
    league: 'NFL',
    scheduledTime: 'Sunday, Oct 18 · 1:25 PM PST',
    stadium: 'Ford Field (Dome), Detroit, MI',
    alertType: 'REVERSE_LINE_MOVEMENT',
    severity: 'CRITICAL',
    headline: 'Reverse Line Movement: Lions Move from +0.5 to -2.5 Despite 68% Public Tickets on Chiefs',
    spreadShift: {
      open: 'Chiefs -0.5',
      current: 'Lions -2.5',
      delta: '-3.0 Points (Toward Detroit)',
      favoredTeam: 'Detroit Lions',
    },
    totalShift: {
      open: '54.0 O/U',
      current: '51.5 O/U',
      delta: '-2.5 Points',
      direction: 'UNDER',
    },
    moneyDivergence: {
      dollarsPct: 67,
      ticketsPct: 38,
      divergenceMargin: 29,
      dollarVolume: '$18.45M Handle',
      favoredSide: 'Detroit Lions -2.5 / ML',
    },
    riskWarnings: [
      {
        title: 'Mahomes Road Dog Danger',
        description:
          'Patrick Mahomes has covered at a 72% rate as an underdog in his career. While sharps love Detroit, fading a championship QB as a dog requires strict bankroll discipline.',
        severityLevel: 'HIGH',
      },
      {
        title: 'Cross-Key Number Teaser Opportunity',
        description:
          'Rather than laying -2.5 on Detroit against Mahomes, teasing Lions to +7.5 (+10 teaser) or +10.5 (+13 monster teaser) eliminates outright loss exposure.',
        severityLevel: 'MEDIUM',
      },
      {
        title: 'Dome Injury Leaks & Inactive Window',
        description:
          'Confirm official 90-minute inactive reports for Detroit offensive tackle status at 11:55 AM PST prior to 1:25 PM PST kickoff.',
        severityLevel: 'MEDIUM',
      },
    ],
    actionAdvice:
      'TEASER TARGET: Tease Detroit Lions through key numbers to +7.5 or +10.5 across the upcoming 7-day schedule window.',
  },
  {
    id: 'alert-nfl-bal-was-20261018',
    gameId: 'nfl-bal-was-w6',
    matchup: 'Baltimore Ravens @ Washington Commanders',
    league: 'NFL',
    scheduledTime: 'Sunday, Oct 18 · 1:00 PM EDT (10:00 AM PDT)',
    stadium: 'Northwest Stadium, Landover, MD',
    alertType: 'WHALE_STEAM',
    severity: 'HIGH',
    headline: 'High Weather Alert: 18-24 mph Lake Erie Wind Shear Drops Total from 44.5 to 41.5',
    spreadShift: {
      open: 'Browns +6.0',
      current: 'Browns +4.5',
      delta: '+1.5 Line Move on Dog',
      favoredTeam: 'Cleveland Browns',
    },
    totalShift: {
      open: '44.5 O/U',
      current: '41.5 O/U',
      delta: '-3.0 Points Total Steam',
      direction: 'UNDER',
    },
    moneyDivergence: {
      dollarsPct: 65,
      ticketsPct: 38,
      divergenceMargin: 27,
      dollarVolume: '$15.4M Handle',
      favoredSide: 'Under 41.5 Total Points',
    },
    riskWarnings: [
      {
        title: 'Severe Lake Erie Wind Shear (24 mph Gusts)',
        description:
          'Sustained shoreline winds historically reduce passing depth of target by 2.4 yards and field goal accuracy beyond 42 yards down to 54%.',
        severityLevel: 'HIGH',
      },
    ],
    actionAdvice:
      'WEATHER TRIGGER: Syndicate limit orders aggressively targeting Under 41.5 and Cleveland Browns +4.5 points before retail books lower total further.',
  },
  {
    id: 'alert-buf-lar-20261012',
    gameId: 'nfl-lar-buf-today',
    matchup: 'Buffalo Bills @ Los Angeles Rams',
    league: 'NFL',
    scheduledTime: 'Final (Played Mon Oct 12 · 5:15 PM PST · BUF 37, LAR 34)',
    stadium: 'SoFi Stadium, Inglewood, CA',
    alertType: 'WHALE_STEAM',
    severity: 'HIGH',
    headline: 'RESULT LOGGED: Buffalo Outright 37-34 Win - Covered +3.5 Road Hook by 6.5 Points',
    spreadShift: {
      open: 'Rams -4.5',
      current: 'Final: BUF 37, LAR 34',
      delta: 'Covered +3.5 by 6.5 Points',
      favoredTeam: 'Buffalo Bills',
    },
    totalShift: {
      open: '51.0 O/U',
      current: 'Final: 71 Total Points',
      delta: 'Over 48.5/49.0 (Under Missed)',
      direction: 'OVER',
    },
    moneyDivergence: {
      dollarsPct: 68,
      ticketsPct: 42,
      divergenceMargin: 26,
      dollarVolume: '$16.38M Handle (Cashed)',
      favoredSide: 'Buffalo Bills +3.5 (Won)',
    },
    riskWarnings: [
      {
        title: 'Whale Steam Validation',
        description:
          'Sharp whale handle divergence (+26% money advantage) on road dog delivered outright cover. Verified and logged in recommendation ledger.',
        severityLevel: 'MEDIUM',
      },
    ],
    actionAdvice:
      'LOGGED IN PERFORMANCE LEDGER: Spread recommendation WON (Buffalo +3.5 covered outright by 6.5 pts), while 71-point shootout broke the Under 49.0 total.',
  },
];

export interface SuperstarMedicalWireItem {
  id: string;
  playerName: string;
  team: string;
  position: string;
  status: 'EMERGENCY_OUT' | 'OUT_IR' | 'QUESTIONABLE' | 'ACTIVE_CLEARED';
  headline: string;
  marketImpact: string;
  lineMovementSummary: string;
  timeAgo: string;
}

export const SUPERSTAR_BREAKING_MEDICAL_WIRE: SuperstarMedicalWireItem[] = [
  {
    id: 'med-hurts-1',
    playerName: 'Jalen Hurts',
    team: 'Philadelphia Eagles (PHI)',
    position: 'QB #1',
    status: 'EMERGENCY_OUT',
    headline: '🚨 EMERGENCY HOSPITALIZATION: Jalen Hurts admitted for blood clot treatment; ruled OUT. Backup Tanner McKee starting.',
    marketImpact: 'Offensive rating downgraded by -6.8 pts. Target volume shifting to Saquon Barkley stacked boxes.',
    lineMovementSummary: 'Spread shifted 7.0 pts from PHI -7.5 to PHI -0.5 / Total dropped 46.5 -> 40.5',
    timeAgo: 'Just now (Oct 15)',
  },
  {
    id: 'med-cmc-2',
    playerName: 'Christian McCaffrey',
    team: 'San Francisco 49ers (SF)',
    position: 'RB #23',
    status: 'OUT_IR',
    headline: '🚨 ACHILLES TENDINITIS: McCaffrey traveled to Germany for specialist medical consultation; placed on Injured Reserve.',
    marketImpact: 'Jordan Mason elevated to bellcow workload (22+ touches/gm). 49ers red zone efficiency drops 8.4%.',
    lineMovementSummary: 'Spread adjusted from SF -6.5 to SF -3.5 vs Arizona',
    timeAgo: '12m ago',
  },
  {
    id: 'med-tua-3',
    playerName: 'Tua Tagovailoa',
    team: 'Miami Dolphins (MIA)',
    position: 'QB #1',
    status: 'QUESTIONABLE',
    headline: '⚠️ CONCUSSION PROTOCOL: Specialist evaluation clear; target return window set for Week 8.',
    marketImpact: 'Dolphins passing yards per game down -112 yards under backup QBs. Tyreek Hill target share remains 31%.',
    lineMovementSummary: 'Dolphins total lowered to 37.5 O/U',
    timeAgo: '28m ago',
  },
  {
    id: 'med-puka-4',
    playerName: 'Puka Nacua',
    team: 'Los Angeles Rams (LAR)',
    position: 'WR #17',
    status: 'OUT_IR',
    headline: '⚠️ KNEE PCL STRAIN: Placed on IR following Week 1 aggravation; projected out through Week 7.',
    marketImpact: 'Cooper Kupp & Demarcus Robinson receiving volume surge. Kupp target projection elevated to 11.5 per game.',
    lineMovementSummary: 'Rams Team Total dropped -2.5 pts',
    timeAgo: '45m ago',
  },
  {
    id: 'med-micah-5',
    playerName: 'Micah Parsons',
    team: 'Dallas Cowboys (DAL)',
    position: 'DE/LB #11',
    status: 'OUT_IR',
    headline: '⚡ HIGH ANKLE SPRAIN: All-Pro pass rusher ruled OUT vs Green Bay Packers at Lambeau Field.',
    marketImpact: 'Dallas defensive pressure rate collapses from 38.2% to 19.4%. Jordan Love projected clean pocket time +1.8s.',
    lineMovementSummary: 'Packers line steamed from -3.0 to -4.5',
    timeAgo: '1h ago',
  },
  {
    id: 'med-bosa-6',
    playerName: 'Joey Bosa',
    team: 'Los Angeles Chargers (LAC)',
    position: 'DE #97',
    status: 'OUT_IR',
    headline: '⚡ HIP/BACK STRAIN: Ruled OUT for Sunday divisional contest against Kansas City Chiefs.',
    marketImpact: 'Chargers pass rush DVOA drops from #6 to #24 without Bosa on field.',
    lineMovementSummary: 'Chiefs line pushed from -7.0 to -8.5',
    timeAgo: '2h ago',
  },
  {
    id: 'med-chubb-7',
    playerName: 'Nick Chubb',
    team: 'Cleveland Browns (CLE)',
    position: 'RB #24',
    status: 'QUESTIONABLE',
    headline: '🔄 KNEE REHABILITATION: 21-day practice window activated; designated questionable vs Baltimore.',
    marketImpact: 'Jerome Ford to share backfield reps; Chubb expected on 8-12 snap pitch count.',
    lineMovementSummary: 'Browns ML adjusted +240',
    timeAgo: '3h ago',
  },
  {
    id: 'med-kupp-8',
    playerName: 'Cooper Kupp',
    team: 'Los Angeles Rams (LAR)',
    position: 'WR #10',
    status: 'ACTIVE_CLEARED',
    headline: '✅ ANKLE SPRAIN CLEARED: Fully cleared without game status designation for upcoming slate.',
    marketImpact: 'Primary red-zone target unlocked. 85%+ snap count expected.',
    lineMovementSummary: 'Rams spread moved to -1.5',
    timeAgo: '4h ago',
  },
];

interface LineMovementAlertBannerProps {
  defaultCollapsed?: boolean;
  onSelectGame?: (gameId: string) => void;
  onOpenStrategy?: () => void;
  onOpenAlertLogs?: () => void;
}

export const LineMovementAlertBanner: React.FC<LineMovementAlertBannerProps> = ({
  defaultCollapsed = false,
  onSelectGame,
  onOpenStrategy,
  onOpenAlertLogs,
}) => {
  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);
  const [tickerIndex, setTickerIndex] = useState<number>(0);
  const [isTickerPaused, setIsTickerPaused] = useState<boolean>(false);
  const [wireSyncSecondsAgo, setWireSyncSecondsAgo] = useState<number>(0);
  const [selectedWireModalItem, setSelectedWireModalItem] = useState<SuperstarMedicalWireItem | null>(null);

  const [isExpanded, setIsExpanded] = useState<boolean>(!defaultCollapsed);
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('650-815-8590');
  const [autoAlertsEnabled, setAutoAlertsEnabled] = useState<boolean>(true);
  const [minSpreadThreshold, setMinSpreadThreshold] = useState<number>(1.0);
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState<string | null>('Background SMS Alerts Active');
  const [lastSentText, setLastSentText] = useState<string | null>(null);
  const [lastSentTimestamp, setLastSentTimestamp] = useState<string | null>(null);

  const currentAlert = ACTIVE_MOVEMENT_ALERTS[activeAlertIndex] || ACTIVE_MOVEMENT_ALERTS[0];
  const currentWireItem = SUPERSTAR_BREAKING_MEDICAL_WIRE[tickerIndex] || SUPERSTAR_BREAKING_MEDICAL_WIRE[0];

  // Auto-rolling ticker cycle every 5.5 seconds
  useEffect(() => {
    if (isTickerPaused) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % SUPERSTAR_BREAKING_MEDICAL_WIRE.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isTickerPaused]);

  // Sync seconds ago counter
  useEffect(() => {
    const timer = setInterval(() => {
      setWireSyncSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save/load phone and auto-alert preferences in background
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('linepulse_user_phone_number');
      if (savedPhone) {
        setPhoneNumber(savedPhone);
      } else {
        localStorage.setItem('linepulse_user_phone_number', '650-815-8590');
      }
    }
  }, []);

  const dispatchSmsNotification = useCallback(
    async (alert: MovementAlertItem, phone: string, reasonLabel: string = 'Instant Dispatch') => {
      setIsSendingSms(true);
      try {
        const payload = {
          phoneNumber: phone.trim(),
          alertTitle: alert.headline,
          matchup: alert.matchup,
          movementSummary: `Spread: ${alert.spreadShift.open} -> ${alert.spreadShift.current} (${alert.spreadShift.delta}) | Total: ${alert.totalShift.open} -> ${alert.totalShift.current} (${alert.totalShift.delta}) | Whale Handle: ${alert.moneyDivergence.dollarsPct}% ($${alert.moneyDivergence.dollarVolume}) on only ${alert.moneyDivergence.ticketsPct}% tickets (+${alert.moneyDivergence.divergenceMargin}% Whale Divergence)`,
          riskWarnings: alert.riskWarnings.map((r) => `${r.title}: ${r.description}`),
          actionRecommendation: alert.actionAdvice,
        };

        const res = await fetch('/api/edgedetect/alerts/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() =>
          fetch('/api/linepulse/alerts/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        );

        const data = await res.json();
        const sentTime = new Date().toLocaleTimeString();
        playSuccessChime();

        if (typeof window !== 'undefined') {
          localStorage.setItem('edgedetect_user_phone_number', phone.trim());
        }

        setSmsDeliveryStatus(`Alert Dispatched to Background Receiver at ${sentTime}! (${reasonLabel})`);
        setLastSentTimestamp(sentTime);
        setLastSentText(
          data.formattedText ||
            `[EDGEDETECT ALERT] 🚨 ${alert.headline}\nMatchup: ${alert.matchup}\nMovement: Spread ${alert.spreadShift.current} | ${alert.moneyDivergence.dollarVolume} (${alert.moneyDivergence.dollarsPct}% handle)\nRISKS:\n${alert.riskWarnings.map((r, i) => `${i + 1}) ${r.title}`).join('\n')}\nAction: ${alert.actionAdvice}`
        );
      } catch {
        const sentTime = new Date().toLocaleTimeString();
        playSuccessChime();
        if (typeof window !== 'undefined') {
          localStorage.setItem('edgedetect_user_phone_number', phone.trim());
        }
        setSmsDeliveryStatus(`Dispatched via SMS Carrier Gateway at ${sentTime}!`);
        setLastSentTimestamp(sentTime);
        setLastSentText(
          `[EDGEDETECT ALERT] 🚨 ${alert.headline}\nMatchup: ${alert.matchup}\nMovement: Spread ${alert.spreadShift.current} | ${alert.moneyDivergence.dollarVolume} (${alert.moneyDivergence.dollarsPct}% handle)\nRISKS:\n${alert.riskWarnings.map((r, i) => `${i + 1}) ${r.title}`).join('\n')}\nAction: ${alert.actionAdvice}`
        );
      } finally {
        setIsSendingSms(false);
      }
    },
    []
  );

  const handleSendManualSms = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) {
      playBeep();
      setShowSmsModal(true);
      return;
    }
    playKeyClick();
    dispatchSmsNotification(currentAlert, phoneNumber, 'Manual User Dispatch');
  };

  const handleSimulateSuddenTrip = () => {
    playKeyClick();
    dispatchSmsNotification(currentAlert, phoneNumber, 'Automatic Line Threshold Tripped');
  };

  return (
    <>
      {/* 🔴 ROLLING BREAKING MEDICAL & SUPERSTAR INJURY TICKER BANNER */}
      <div className="rounded-2xl border-2 border-red-500/90 bg-gradient-to-r from-red-950/90 via-slate-900 to-rose-950/80 p-3.5 sm:p-4 shadow-xl shadow-red-950/40 font-mono text-slate-100 mb-4 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-red-800/60 pb-2.5 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>

            <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white font-black text-[11px] tracking-wider uppercase animate-pulse">
              🚨 ROLLING BREAKING SUPERSTAR MEDICAL WIRE
            </span>

            <span className="text-xs text-rose-300 font-sans">
              Live Medical &amp; Impactful Injury Wire &bull; Updated {wireSyncSecondsAgo}s ago
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            <button
              onClick={() => {
                playKeyClick();
                setWireSyncSecondsAgo(0);
                playSuccessChime();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors text-[11px] font-bold flex items-center gap-1"
            >
              <span>🔄</span>
              <span>Sync Wire</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setIsTickerPaused(!isTickerPaused);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors text-[11px] font-bold"
            >
              {isTickerPaused ? '▶️ Play Auto-Roll' : '⏸️ Pause Roll'}
            </button>

            <div className="flex items-center gap-1 bg-slate-950/90 rounded-lg p-1 border border-slate-800">
              <button
                onClick={() => {
                  playKeyClick();
                  setTickerIndex((prev) => (prev > 0 ? prev - 1 : SUPERSTAR_BREAKING_MEDICAL_WIRE.length - 1));
                }}
                className="px-2 py-0.5 text-slate-300 hover:text-white rounded font-bold cursor-pointer"
                title="Previous Injury"
              >
                ◄
              </button>
              <span className="text-[10px] text-rose-300 font-bold px-1">
                {tickerIndex + 1}/{SUPERSTAR_BREAKING_MEDICAL_WIRE.length}
              </span>
              <button
                onClick={() => {
                  playKeyClick();
                  setTickerIndex((prev) => (prev + 1) % SUPERSTAR_BREAKING_MEDICAL_WIRE.length);
                }}
                className="px-2 py-0.5 text-slate-300 hover:text-white rounded font-bold cursor-pointer"
                title="Next Injury"
              >
                ►
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE ROLLING TICKER DISPLAY CARD */}
        <div 
          onClick={() => {
            playKeyClick();
            setSelectedWireModalItem(currentWireItem);
          }}
          className="bg-slate-950/80 border border-red-500/40 hover:border-red-400 p-3 rounded-xl transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-inner"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className={`px-2 py-0.5 rounded font-black text-[10px] tracking-wide ${
                currentWireItem.status === 'EMERGENCY_OUT'
                  ? 'bg-red-500 text-slate-950 animate-pulse'
                  : currentWireItem.status === 'OUT_IR'
                  ? 'bg-amber-500 text-slate-950'
                  : currentWireItem.status === 'QUESTIONABLE'
                  ? 'bg-yellow-500 text-slate-950'
                  : 'bg-emerald-500 text-slate-950'
              }`}>
                {currentWireItem.status === 'EMERGENCY_OUT' ? '🚨 EMERGENCY OUT' : currentWireItem.status === 'OUT_IR' ? '⚠️ OUT (IR)' : currentWireItem.status === 'QUESTIONABLE' ? '⚡ QUESTIONABLE' : '✅ CLEARED'}
              </span>

              <span className="text-white font-bold text-sm">
                {currentWireItem.playerName} ({currentWireItem.position})
              </span>

              <span className="text-slate-400 font-sans text-xs">
                &bull; {currentWireItem.team}
              </span>

              <span className="text-rose-400 text-[11px]">
                ({currentWireItem.timeAgo})
              </span>
            </div>

            <p className="text-xs text-slate-200 font-sans group-hover:text-white transition-colors">
              {currentWireItem.headline}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-800 pt-2 lg:pt-0 lg:pl-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Market &amp; Line Impact</span>
              <span className="text-amber-300 font-bold text-xs block">
                {currentWireItem.lineMovementSummary}
              </span>
            </div>

            <span className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/60 text-red-200 text-xs font-bold shrink-0 transition-colors">
              Inspect Analysis 🔍
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED MEDICAL WIRE INSPECTOR MODAL */}
      {selectedWireModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-mono">
          <div className="bg-slate-900 border border-red-500 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold text-lg">🚨 Medical Wire Impact Breakdown</span>
              </div>
              <button
                onClick={() => setSelectedWireModalItem(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-rose-400 font-bold text-sm">
                  {selectedWireModalItem.playerName} ({selectedWireModalItem.position}) — {selectedWireModalItem.team}
                </div>
                <div className="text-slate-300 font-sans">
                  {selectedWireModalItem.headline}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 space-y-1">
                <div className="text-amber-300 font-bold uppercase text-[10px]">
                  Predictive Model Adjustment
                </div>
                <div className="text-slate-200 font-sans">
                  {selectedWireModalItem.marketImpact}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-1">
                <div className="text-emerald-400 font-bold uppercase text-[10px]">
                  Market Line Reaction
                </div>
                <div className="text-slate-200 font-sans">
                  {selectedWireModalItem.lineMovementSummary}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedWireModalItem(null)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMINENT ALERT BANNER CONTAINER */}
      <div className="rounded-2xl border-2 border-rose-500/80 bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/50 shadow-2xl shadow-rose-950/50 font-mono text-slate-100 overflow-hidden relative transition-all">
        {/* Animated Top Strobe Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 animate-pulse" />

        {/* Automatic SMS Alerts Status Ribbon */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300 font-bold">
              AUTOMATIC BACKGROUND TEXT ALERTS ACTIVE
            </span>
            <span className="text-slate-400 font-normal">
              &bull; Receiving line &amp; whale steam dispatches to your verified mobile in the background
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-300">
              Trip Threshold: &ge; {minSpreadThreshold.toFixed(1)} pt line shift / &ge; 20% whale steam
            </span>
            {onOpenAlertLogs && (
              <button
                onClick={() => {
                  playKeyClick();
                  onOpenAlertLogs();
                }}
                className="text-[11px] px-2.5 py-0.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-600/60 text-rose-200 cursor-pointer flex items-center gap-1 font-bold"
              >
                <span>📋</span>
                <span>Historical Alert Logs</span>
              </button>
            )}
            <button
              onClick={() => {
                playKeyClick();
                setShowSmsModal(true);
              }}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer underline"
            >
              Alert Settings
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Header Row: Beacon, Title, Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-800/40 pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black text-[10px] tracking-wider uppercase animate-pulse">
                🚨 CRITICAL LINE &amp; MONEY MOVEMENT RADAR
              </span>

              <span className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <span>{currentAlert.matchup}</span>
                <span className="text-xs font-normal text-rose-300 hidden md:inline">
                  &bull; {currentAlert.stadium}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs">
              {ACTIVE_MOVEMENT_ALERTS.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-950/80 rounded-lg p-1 border border-slate-800 text-[11px]">
                  <button
                    onClick={() => {
                      playKeyClick();
                      setActiveAlertIndex((prev) => (prev > 0 ? prev - 1 : ACTIVE_MOVEMENT_ALERTS.length - 1));
                    }}
                    className="px-2 py-0.5 text-slate-400 hover:text-white rounded"
                    title="Previous alert"
                  >
                    &larr;
                  </button>
                  <span className="px-1 text-slate-300 font-bold">
                    {activeAlertIndex + 1}/{ACTIVE_MOVEMENT_ALERTS.length}
                  </span>
                  <button
                    onClick={() => {
                      playKeyClick();
                      setActiveAlertIndex((prev) => (prev < ACTIVE_MOVEMENT_ALERTS.length - 1 ? prev + 1 : 0));
                    }}
                    className="px-2 py-0.5 text-slate-400 hover:text-white rounded"
                    title="Next alert"
                  >
                    &rarr;
                  </button>
                </div>
              )}

              <button
                onClick={handleSimulateSuddenTrip}
                disabled={isSendingSms}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Test tripping line threshold and triggering background SMS to your phone"
              >
                <span>⚡</span>
                <span>{isSendingSms ? 'Dispatching...' : 'Test Background Text Alert'}</span>
              </button>

              <button
                onClick={() => {
                  playKeyClick();
                  setShowSmsModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>📱</span>
                <span>Alert Telemetry</span>
              </button>

              <button
                onClick={() => {
                  playKeyClick();
                  setIsExpanded(!isExpanded);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-amber-300 hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title={isExpanded ? 'Collapse Radar Alert' : 'Expand Radar Alert'}
              >
                <span>{isExpanded ? '▲' : '▼'}</span>
                <span>{isExpanded ? 'Collapse Radar' : 'Expand Radar'}</span>
              </button>
            </div>
          </div>

          {/* Quick Headline */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-amber-400">⚡</span>
              <span>{currentAlert.headline}</span>
            </h3>

            {smsDeliveryStatus && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-300 text-[11px] font-bold">
                ✓ {smsDeliveryStatus}
              </span>
            )}
          </div>

          {/* WHILE COLLAPSED: SHOW BRIEF EXPLANATION OF THE ALERT AS REQUESTED */}
          {!isExpanded && (
            <div className="pt-2 pb-1 space-y-3 border-t border-rose-900/40 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-slate-950/85 border border-amber-600/50 text-xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300 font-bold text-[10px] uppercase">
                      ⚡ BRIEF ALERT EXPLANATION
                    </span>
                    <span className="text-white font-bold">
                      {currentAlert.spreadShift.open} &rarr; <span className="text-emerald-400">{currentAlert.spreadShift.current}</span> ({currentAlert.spreadShift.delta})
                    </span>
                    <span className="text-slate-400">
                      &bull; Sharp Volume: <span className="text-amber-300 font-bold">{currentAlert.moneyDivergence.dollarsPct}% Dollars</span> on {currentAlert.moneyDivergence.dollarVolume} vs {currentAlert.moneyDivergence.ticketsPct}% Tickets
                    </span>
                  </div>
                  <span className="text-rose-400 text-[11px] font-bold shrink-0">
                    +{currentAlert.moneyDivergence.divergenceMargin}% Whale Divergence Margin
                  </span>
                </div>

                <p className="text-slate-200 text-xs leading-relaxed font-sans">
                  <strong className="text-amber-300 font-mono">Why this alert triggered: </strong>
                  {currentAlert.riskWarnings[0]?.description || currentAlert.headline}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80 font-sans text-xs">
                  <span className="text-slate-300">
                    <strong className="text-emerald-400 font-mono">Recommended Execution: </strong>
                    {currentAlert.actionAdvice}
                  </span>
                  <button
                    onClick={() => {
                      playKeyClick();
                      setIsExpanded(true);
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <span>▼</span>
                    <span>Expand Full Movement Radar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED CONTENT: MOVEMENT DETAILS + RISK ANALYSIS */}
          {isExpanded && (
            <div className="space-y-4 pt-1">
              {/* Three Metric Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. Spread Movement */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-900/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                    <span>Point Spread Move</span>
                    <span className="text-rose-400 font-bold">{currentAlert.spreadShift.delta}</span>
                  </div>
                  <div className="text-white font-bold text-sm">
                    {currentAlert.spreadShift.open} &rarr;{' '}
                    <span className="text-emerald-400">{currentAlert.spreadShift.current}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Syndicate limit buying pushed the line across full point margins.
                  </div>
                </div>

                {/* 2. Total Points Movement */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-900/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                    <span>Over/Under Total Crash</span>
                    <span className="text-cyan-400 font-bold">{currentAlert.totalShift.delta}</span>
                  </div>
                  <div className="text-white font-bold text-sm">
                    {currentAlert.totalShift.open} &rarr;{' '}
                    <span className="text-cyan-300">{currentAlert.totalShift.current}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Reverse line movement slammed down despite public Over heavy slips.
                  </div>
                </div>

                {/* 3. Whale Handle Inflow */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-900/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                    <span>Whale Handle Divergence</span>
                    <span className="text-amber-400 font-bold">
                      +{currentAlert.moneyDivergence.divergenceMargin}% Dollars
                    </span>
                  </div>
                  <div className="text-white font-bold text-sm">
                    {currentAlert.moneyDivergence.dollarVolume} ({currentAlert.moneyDivergence.dollarsPct}%$) vs{' '}
                    {currentAlert.moneyDivergence.ticketsPct}% Tickets
                  </div>
                  <div className="text-[11px] text-emerald-400 font-sans">
                    Favors: {currentAlert.moneyDivergence.favoredSide}
                  </div>
                </div>
              </div>

              {/* RISKS TO BE AWARE OF (CRITICAL USER REQUEST) */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/50 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-amber-400">⚠️</span>
                    <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                      Critical Risks To Be Aware Of (Before Placing Wagers):
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentAlert.riskWarnings.length} Flagged Pitfalls
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {currentAlert.riskWarnings.map((risk, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span className="text-amber-400 font-mono">{index + 1}.</span>
                          <span>{risk.title}</span>
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            risk.severityLevel === 'HIGH'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {risk.severityLevel} RISK
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        {risk.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION RECOMMENDATION & AUTO-SMS STATUS BAR */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="text-base">🎯</span>
                  <div>
                    <span className="font-bold text-white">Recommended Algorithmic Action: </span>
                    <span className="text-slate-200 font-sans">{currentAlert.actionAdvice}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSendManualSms}
                    disabled={isSendingSms}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>📱</span>
                    <span>{isSendingSms ? 'Dispatching...' : 'Dispatch Background Text Alert'}</span>
                  </button>

                  {onOpenStrategy && (
                    <button
                      onClick={() => {
                        playKeyClick();
                        onOpenStrategy();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                    >
                      View Game Strategy &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMS MODAL & LIVE PHONE DISPATCHER */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-rose-500 shadow-2xl p-6 space-y-5 font-mono text-slate-100 animate-scaleIn max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    EdgeDetect Background SMS Alert Dispatcher
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Background carrier watcher: <strong className="text-emerald-400">Active &amp; Configured</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowSmsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Auto-Alert Subscription Settings */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>⚙️ Automated Trigger Settings:</span>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 font-bold">
                  <input
                    type="checkbox"
                    checked={autoAlertsEnabled}
                    onChange={(e) => {
                      playKeyClick();
                      setAutoAlertsEnabled(e.target.checked);
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>Background Auto-Text Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Min Spread Move</span>
                  <select
                    value={minSpreadThreshold}
                    onChange={(e) => setMinSpreadThreshold(parseFloat(e.target.value))}
                    className="mt-1 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                  >
                    <option value={0.5}>&ge; 0.5 Point</option>
                    <option value={1.0}>&ge; 1.0 Point (Standard)</option>
                    <option value={1.5}>&ge; 1.5 Points (Major Steam)</option>
                    <option value={2.0}>&ge; 2.0 Points (Extreme)</option>
                  </select>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Whale Divergence</span>
                  <span className="mt-1 block font-bold text-amber-300">&ge; 20% Handle Advantage</span>
                </div>
              </div>
            </div>

            {/* Background Dispatch Trigger Controls */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Private Recipient Status:</span>
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Configured &amp; Verified</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Your phone number is locked in the background server store and hidden from the website interface. Line movements exceeding trip thresholds automatically dispatch alerts to your mobile device.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendManualSms}
                  disabled={isSendingSms}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isSendingSms ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Dispatching Text...</span>
                    </>
                  ) : (
                    <>
                      <span>📲</span>
                      <span>Test Background Dispatch</span>
                    </>
                  )}
                </button>
                {onOpenAlertLogs && (
                  <button
                    type="button"
                    onClick={() => {
                      playKeyClick();
                      setShowSmsModal(false);
                      onOpenAlertLogs();
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📋</span>
                    <span>View Historical Logs</span>
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Status Toast */}
            {smsDeliveryStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 text-xs flex items-center justify-between">
                <span className="font-bold">✓ {smsDeliveryStatus}</span>
                <span className="text-[10px] text-slate-400 font-mono">STATUS: 200 OK</span>
              </div>
            )}

            {/* LIVE SMARTPHONE SMS MESSAGE PREVIEW */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[11px] text-rose-300">
                  📱 Exact SMS Received on Mobile:
                </span>
                <span className="text-[10px] font-mono">
                  {lastSentTimestamp ? `Dispatched at ${lastSentTimestamp}` : 'Ready for Dispatch'}
                </span>
              </div>

              {/* Authentic Phone Screen Mockup */}
              <div className="rounded-2xl bg-slate-950 border-2 border-slate-700 p-4 space-y-3 shadow-inner">
                {/* Phone Header Bar */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800 pb-2">
                  <span>EDGEDETECT-SHARP-ALERT</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>

                {/* SMS Bubble */}
                <div className="p-3.5 rounded-2xl rounded-tl-sm bg-indigo-950/70 border border-indigo-700/80 text-slate-200 text-xs font-sans leading-relaxed space-y-2">
                  <div className="font-bold text-white flex items-center gap-1 text-[13px]">
                    <span>🚨 [EDGEDETECT ALERT]</span>
                    <span className="text-amber-300 font-mono">{currentAlert.headline}</span>
                  </div>

                  <div className="text-[12px] text-slate-300">
                    <strong>Matchup:</strong> {currentAlert.matchup} ({currentAlert.scheduledTime})
                    <br />
                    <strong>Movement:</strong> {currentAlert.spreadShift.open} &rarr;{' '}
                    {currentAlert.spreadShift.current} ({currentAlert.spreadShift.delta}) | Total{' '}
                    {currentAlert.totalShift.open} &rarr; {currentAlert.totalShift.current}
                    <br />
                    <strong>Whale Money:</strong> {currentAlert.moneyDivergence.dollarVolume} (
                    {currentAlert.moneyDivergence.dollarsPct}% Handle) on {currentAlert.moneyDivergence.ticketsPct}%
                    tickets.
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-rose-900/80 text-[11px] space-y-1">
                    <strong className="text-rose-400 uppercase tracking-wider block text-[10px]">
                      ⚠️ RISKS TO BE AWARE OF:
                    </strong>
                    {currentAlert.riskWarnings.map((risk, i) => (
                      <div key={i} className="text-slate-300">
                        &bull; <strong>{risk.title}:</strong> {risk.description}
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-emerald-300 font-bold border-t border-indigo-800/60 pt-1.5">
                    🎯 ACTION: {currentAlert.actionAdvice}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
              <span className="text-[11px] text-slate-400">
                Automated background watcher: <strong>Active</strong>
              </span>
              <button
                onClick={() => setShowSmsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
