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
