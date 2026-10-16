export type SportsLeague = 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'NCAA_FB';

export interface SportsbookOdds {
  bookName: string;
  bookLogo?: string;
  spreadHome: number;
  spreadHomeOdds: number;
  spreadAway: number;
  spreadAwayOdds: number;
  totalOver: number;
  totalOverOdds: number;
  totalUnder: number;
  totalUnderOdds: number;
  moneylineHome: number;
  moneylineAway: number;
  isBestSpreadHome?: boolean;
  isBestTotalOver?: boolean;
  isBestMoneylineHome?: boolean;
  lastUpdated: string;
}

export interface LineMovementPoint {
  timestamp: string;
  timeLabel: string;
  spread: number;
  total: number;
  moneylineHome: number;
  note?: string;
}

export interface BettingSplit {
  side: string;
  ticketPercentage: number;   // % of total bets placed
  moneyPercentage: number;    // % of total dollars wagered
  totalTicketsCount: number;  // raw count of wagers
  totalHandleAmount: number;  // total dollar handle
  sharpSignal: 'HEAVY_SHARP' | 'MODERATE_SHARP' | 'BALANCED' | 'PUBLIC_HEAVY';
  divergenceNotice?: string;
}

export interface StrategyLeg {
  id: string;
  gameId: string;
  gameMatchup: string;
  gameDate: string;
  betType: 'SPREAD' | 'MONEYLINE' | 'TOTAL' | 'PLAYER_PROP' | 'TEAM_TOTAL';
  targetSelection: string;
  originalLine: string;
  teasedLine?: string; // e.g. +3.5 teased by +10 -> +13.5
  bestOdds: string;
  bestSportsbook: string;
  impliedProb: number;
  modelEdge: number; // positive % edge vs market
  rationale: string;
}

export type StrategyCardType = 
  | 'SINGLE_GAME'     // 1 Single Game Straight Bet
  | 'PARLAY_3LEG'     // 1 Parlay of up to 3 bets
  | 'TEASER_3TEAM_10' // 1 3-Team +10 Teaser
  | 'TEASER_4TEAM_13';// 1 4-Team +13 Teaser (spans max 2 days)

export interface DailyBetPackage {
  id: string;
  type: StrategyCardType;
  title: string;
  subtitle: string;
  badge: string;
  teaserPoints?: number; // e.g. 10 or 13
  expectedValue: number; // EV %
  confidenceScore: number; // 0-100
  payoutOdds: string; // e.g. -110, +580, -120
  daySpanNote: string; // e.g. "Today Only" or "Spans 2 Days (Mon & Tue)"
  legs: StrategyLeg[];
  keyDiscrepancy: string;
  executionInstructions: string;
}

export interface DailySlatePortfolio {
  dateLabel: string;
  dateKey: string; // e.g. '2026-10-12'
  headline: string;
  singleGameBet: DailyBetPackage;
  parlayBet: DailyBetPackage;
  teaser3Team10Pt: DailyBetPackage;
  teaser4Team13Pt: DailyBetPackage;
}

export interface PrimeStrategy {
  strategyName: string;
  riskRating: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  expectedValue: number; // EV %
  confidenceScore: number; // 0-100
  totalHandleAnalyzed: string;
  keyDiscrepancy: string;
  legs: StrategyLeg[];
  compositeSummary: string;
  executionInstructions: string;
}

export interface GameMarket {
  id: string;
  league: SportsLeague;
  homeTeam: {
    name: string;
    city: string;
    abbr: string;
    record: string;
    logoColor: string;
  };
  awayTeam: {
    name: string;
    city: string;
    abbr: string;
    record: string;
    logoColor: string;
  };
  scheduledTime: string;
  stadium: string;
  weatherCondition?: string;
  status: 'UPCOMING' | 'LIVE' | 'FINAL';
  scores?: { home: number; away: number };
  
  // Public Wagering Volume
  totalBetsPlaced: number;
  totalDollarsWagered: number; // Total handle
  splits: {
    spread: {
      home: BettingSplit;
      away: BettingSplit;
    };
    moneyline: {
      home: BettingSplit;
      away: BettingSplit;
    };
    total: {
      over: BettingSplit;
      under: BettingSplit;
    };
  };

  // Line Movement History
  lineMovements: LineMovementPoint[];

  // Odds across major public books
  sportsbooks: SportsbookOdds[];

  // Best consensus market
  consensus: {
    spread: string;
    total: number;
    moneylineHome: number;
    moneylineAway: number;
  };

  // Is this the 1 selected Prime Game of the Slate?
  isPrimeOpportunity?: boolean;
  primeStrategy?: PrimeStrategy;

  // Sports Analysts Data & Contrarian Fade Consensus
  analystConsensus?: AnalystMarketConsensus;

  // Latest News & Injury Report Summaries with Line Impact
  injuries?: GameInjurySummary;
  weatherForecast?: GameWeatherForecast;
  latestNews?: GameNewsItem[];

  // 3-Way Bet Opinions (Spread, Moneyline, Over/Under) & Slate-Wide Confidence Ranking
  marketOpinions?: GameMarketOpinions;

  // Real-time Active Shifts in Betting Volume (Units & Dollars)
  liveVolumeShifts?: ActiveGameVolumeShifts;
}

export interface ActiveVolumeShiftWindow {
  window: '5M' | '15M' | '1H';
  unitsHome: number; // + tickets on home
  unitsAway: number; // + tickets on away
  dollarsHome: number; // + dollars on home
  dollarsAway: number; // + dollars on away
  unitsOver: number; // + tickets on over
  unitsUnder: number; // + tickets on under
  dollarsOver: number; // + dollars on over
  dollarsUnder: number; // + dollars on under
  dominantSide: string; // e.g. "Seattle Seahawks -2.5"
  swingVelocity: 'HEAVY_STEAM' | 'STEADY_ACCUMULATION' | 'BALANCED_DRIFT';
  swingSummary: string; // e.g. "+$420k / +1,850 units swinging to SEA in last 15m"
}

export interface VolumeTickPulse {
  id: string;
  timestamp: string;
  gameId: string;
  matchup: string;
  targetSelection: string;
  marketType: 'SPREAD' | 'MONEYLINE' | 'TOTAL';
  unitDelta: number; // e.g. +340 bets
  dollarDelta: number; // e.g. +$85,000
  sportsbook: string;
  tag: 'WHALE_LIMIT' | 'STEAM_SURGE' | 'PUBLIC_SWARM';
  summary: string;
}

export interface ActiveGameVolumeShifts {
  lastUpdated: string;
  shiftVelocityRatePerMinute: {
    unitsPerMin: number;
    dollarsPerMin: number;
  };
  netSpreadSwingPct: number; // -100 (100% Home) to +100 (100% Away)
  netTotalSwingPct: number; // -100 (100% Under) to +100 (100% Over)
  windows: {
    fiveMin: ActiveVolumeShiftWindow;
    fifteenMin: ActiveVolumeShiftWindow;
    oneHour: ActiveVolumeShiftWindow;
  };
  recentPulses: VolumeTickPulse[];
}

export type BetVerdictRating = 'STRONG_BUY' | 'BUY' | 'LEAN' | 'AVOID_PASS';
export type ConfidenceTier = 'MAX_LOCK' | 'HIGH_CONVICTION' | 'STRONG_VALUE' | 'MODERATE_EDGE' | 'VOLATILE_LEAN';

export interface SingleMarketVerdict {
  betType: 'SPREAD' | 'MONEYLINE' | 'TOTAL';
  pick: string; // e.g. "Seattle Seahawks -2.5", "Seattle Seahawks ML (-140)", "Under 40.5"
  odds: string; // e.g. "-110", "-140", "-110"
  bestSportsbook: string; // e.g. "DraftKings", "Circa Sports", "FanDuel"
  modelEdge: number; // e.g. 7.4 (percentage)
  confidenceRating: number; // 1 to 100 (e.g. 96, 91, 84)
  confidenceStars: number; // 1 to 5
  verdict: BetVerdictRating;
  selectionSummary: string; // Short actionable callout
  rationale: string; // Comprehensive explanation of why this was picked
}

export interface GameMarketOpinions {
  overallConfidenceRank: number; // 1 = Most Confident, 2 = 2nd most confident, ..., 10 = least confident
  overallConfidenceScore: number; // 1 to 100 (e.g. 96)
  confidenceTier: ConfidenceTier;
  primaryRecommendedBet: 'SPREAD' | 'MONEYLINE' | 'TOTAL';
  executiveMatchupVerdict: string; // Complete executive thesis of why this game is ranked here
  spreadOpinion: SingleMarketVerdict;
  moneylineOpinion: SingleMarketVerdict;
  totalOpinion: SingleMarketVerdict;
  keyFactors: {
    weatherImpactFactor: string;
    injuryAdvantage: string;
    sharpMoneySignal: string;
    schemeEdge: string;
  };
}

export interface PlayerInjuryItem {
  player: string;
  position: string;
  status: 'OUT' | 'DOUBTFUL' | 'QUESTIONABLE' | 'IR' | 'ACTIVE' | 'RETIRED';
  injury: string; // e.g. "Concussion", "Hamstring", "Ankle", "Knee"
  gameImpact: string; // Tactical description of impact on the game/line
}

export interface GameInjurySummary {
  homeInjuries: PlayerInjuryItem[];
  awayInjuries: PlayerInjuryItem[];
  lineImpactAnalysis: string; // Concrete breakdown of how bookmakers adjust lines
  totalImpactRating: 'MINIMAL' | 'MODERATE' | 'SIGNIFICANT' | 'GAME_CHANGING';
}

export interface GameWeatherForecast {
  isDome: boolean;
  temperature: string; // e.g. "54°F"
  conditions: string; // e.g. "Clear Autumn Night", "Sustained Lake Winds", "Climate-Controlled Dome"
  wind: string; // e.g. "6 mph NW", "18-24 mph Gusts"
  humidity: string; // e.g. "32%"
  precipitationChance: string; // e.g. "0%", "35% Drizzle"
  altitudeFt?: number; // e.g. 5280
  impactLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'NONE_DOME';
  impactSummary: string; // Tactical impact on totals, field goals, passing depth, and ball security
}

export interface GameNewsItem {
  id: string;
  headline: string;
  source: string; // e.g. "ESPN NFL Wire", "CBS Sports", "NFL Network"
  timeAgo: string; // e.g. "1h ago"
  summary: string;
  relevance: 'CRITICAL_LINE_MOVE' | 'INJURY_UPDATE' | 'COACHING_SCHEME' | 'MARKET_FLOW';
}

export interface SportsAnalyst {
  id: string;
  name: string;
  network: string;
  role: string;
  seasonRecord: string;
  profileBadge?: string;
  avatarInitial: string;
  avatarBg: string;
}

export interface AnalystPick {
  id: string;
  analystId: string;
  analystName: string;
  network: string;
  avatarInitial: string;
  avatarBg: string;
  seasonRecord: string;
  betType: 'SPREAD' | 'MONEYLINE' | 'TOTAL';
  selection: string;
  confidenceRating: number; // 1 to 5
  publishedTime: string;
  rationale: string;
  isContrarianFadeTarget?: boolean;
}

export interface AnalystMarketConsensus {
  gameId: string;
  gameMatchup: string;
  league: SportsLeague;
  homeTeamName: string;
  awayTeamName: string;
  totalAnalystsTracked: number;
  spread: {
    homeSelection: string;
    awaySelection: string;
    homeCount: number;
    awayCount: number;
    homePct: number;
    awayPct: number;
    consensusFavoriteSide: 'HOME' | 'AWAY';
  };
  total?: {
    overSelection: string;
    underSelection: string;
    overCount: number;
    underCount: number;
    overPct: number;
    underPct: number;
  };
  publicComparison: {
    publicHomeTicketPct: number;
    publicAwayTicketPct: number;
    publicHomeMoneyPct: number;
    publicAwayMoneyPct: number;
    sharpAdvantageSide: 'HOME' | 'AWAY';
    sharpHandleDifference: number;
  };
  contrarianFadeSignal: {
    triggered: boolean;
    severity: 'EXTREME' | 'HIGH' | 'MODERATE' | 'NONE';
    fadeTarget: string; // The contrarian side to bet on
    crowdFavorite: string; // The chalk side everyone is on
    analystChalkPct: number;
    publicTicketPct: number;
    sharpMoneyPct: number;
    echoChamberScore: number; // 0 - 100
    gamblingTheoryRule: string;
    recommendedAction: string;
  };
  picks: AnalystPick[];
}
