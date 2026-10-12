export type BetOutcome = 'WON' | 'LOST' | 'PUSH' | 'PENDING';

export type TrackedBetTier =
  | 'SINGLE_GAME'     // 1 Single Game Straight Bet
  | 'PARLAY_3LEG'     // 1 Parlay of up to 3 bets
  | 'TEASER_3TEAM_10' // 1 3-Team +10 Teaser
  | 'TEASER_4TEAM_13' // 1 4-Team +13 Teaser
  | 'PRIME_1GAME';    // 1-Game Prime Multi-Leg Blueprint

export interface TrackedBetLeg {
  id: string;
  gameMatchup: string;
  league: string;
  gameDate: string;
  betType: 'SPREAD' | 'MONEYLINE' | 'TOTAL' | 'PLAYER_PROP';
  targetSelection: string;
  originalLine: string;
  teasedLine?: string;
  bestOdds: string;
  bestSportsbook: string;
  status: BetOutcome;
  finalScore?: string;
  rationale: string;
}

export type PatternSignalType =
  | 'WHALE_DIVERGENCE_20PLUS'   // Money % - Ticket % >= 20%
  | 'HOME_UNDERDOG'             // Underdog playing at home
  | 'HIGH_WIND_UNDER'           // Outdoor stadium with wind >= 12mph
  | 'KEY_NUMBER_CROSS_3_7'      // Teaser crossed through both 3 & 7
  | 'REVERSE_LINE_MOVEMENT'     // Line moved opposite to majority tickets
  | 'PUBLIC_ROAD_FAVORITE_FADE' // Public heavily betting road favorite (>65% tickets)
  | 'SAME_GAME_CORRELATED'      // Legs correlated on game script (e.g. dog spread + under)
  | 'CROSS_SPORT_PARLAY';       // Parlay combining multiple different leagues

export interface TrackedBetRecommendation {
  id: string;
  date: string;                  // 'YYYY-MM-DD'
  dateLabel: string;             // e.g. 'Oct 12, 2026'
  slateTitle: string;            // e.g. 'Week 6 Monday Night Slate'
  tier: TrackedBetTier;
  title: string;
  subtitle: string;
  badge: string;
  targetMatchup: string;
  payoutOdds: string;
  unitsStaked: number;           // e.g. 1.0, 0.75, 1.5, 1.35
  unitsWonLost: number;          // calculated net result
  status: BetOutcome;
  settledAt?: string;
  legs: TrackedBetLeg[];
  signalsTagged: PatternSignalType[];
  preBetRationale: string;
  postGameAnalysis?: string;
  learnedTakeaway?: string;
  appliedWeights?: {
    signal: PatternSignalType;
    weightMultiplier: number;
    description: string;
  }[];
}

export interface PatternSignalMetric {
  signal: PatternSignalType;
  label: string;
  description: string;
  icon: string;
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;               // 0-100%
  netUnits: number;
  roi: number;                   // ROI %
  baselineWeight: number;        // Standard 1.00x
  learnedWeight: number;         // Dynamic weight (e.g. 1.30x or 0.70x)
  weightStatus: 'BOOSTED' | 'MODERATE_BOOST' | 'NEUTRAL' | 'PENALIZED';
  strategyImpactNote: string;
}

export interface TrackerPerformanceSummary {
  totalRecommendations: number;
  settledCount: number;
  pendingCount: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;               // % of settled non-push bets
  totalUnitsStaked: number;
  netUnitsWon: number;
  roi: number;                   // ROI %
  currentStreak: string;         // e.g. 'W4' or 'L1'
  bestStreak: string;            // e.g. 'W6'
  tierBreakdown: {
    tier: TrackedBetTier;
    label: string;
    total: number;
    wins: number;
    losses: number;
    pushes: number;
    pending: number;
    netUnits: number;
    winRate: number;
  }[];
}
