import {
  TrackedBetRecommendation,
  PatternSignalType,
  PatternSignalMetric,
  TrackerPerformanceSummary,
  TrackedBetTier,
} from '../types/sportsBettingTracker';

// Initial baseline weights
export const BASELINE_STRATEGY_WEIGHTS: Record<PatternSignalType, number> = {
  WHALE_DIVERGENCE_20PLUS: 1.0,
  HOME_UNDERDOG: 1.0,
  HIGH_WIND_UNDER: 1.0,
  KEY_NUMBER_CROSS_3_7: 1.0,
  REVERSE_LINE_MOVEMENT: 1.0,
  PUBLIC_ROAD_FAVORITE_FADE: 1.0,
  SAME_GAME_CORRELATED: 1.0,
  CROSS_SPORT_PARLAY: 1.0,
};

export const PATTERN_SIGNAL_METADATA: Record<
  PatternSignalType,
  { label: string; icon: string; description: string }
> = {
  WHALE_DIVERGENCE_20PLUS: {
    label: 'Whale Handle Inflow (+20% Money Divergence)',
    icon: '🐋',
    description: 'Dollar handle % exceeds ticket bet % by 20% or more, indicating high-roller syndicate backing.',
  },
  HOME_UNDERDOG: {
    label: 'Home Underdog with Points',
    icon: '🏟️',
    description: 'Home team getting spread points (+3.5 or higher), benefiting from home field noise and game script control.',
  },
  HIGH_WIND_UNDER: {
    label: 'High Wind Outdoor Under (>= 12mph)',
    icon: '🌪️',
    description: 'Cold weather and high crosswinds severely reducing passing efficiency and deep field goal accuracy.',
  },
  KEY_NUMBER_CROSS_3_7: {
    label: 'Teaser Key Number Threshold Cross (3, 7, 10)',
    icon: '🏈',
    description: 'Teasing spreads through the NFL key margin of victory numbers (3 and 7) and totals through primary scoring clusters.',
  },
  REVERSE_LINE_MOVEMENT: {
    label: 'Reverse Line Movement (RLM)',
    icon: '📉',
    description: 'The point spread or total moves against the majority ticket percentage (>60% of tickets on opposite side).',
  },
  PUBLIC_ROAD_FAVORITE_FADE: {
    label: 'Public Road Favorite Fade (>65% Tickets)',
    icon: '🎯',
    description: 'Fading recreational bettors laying heavy road chalk on public darlings.',
  },
  SAME_GAME_CORRELATED: {
    label: 'Correlated Same-Game Script',
    icon: '🔗',
    description: 'Pairing dog spread cover with low-scoring total, multiplying positive game flow dependency.',
  },
  CROSS_SPORT_PARLAY: {
    label: 'Cross-Sport Uncorrelated Parlay',
    icon: '⚡',
    description: 'Multi-sport parlay across different leagues (NFL + MLB + NBA). Historically high variance.',
  },
};

/**
 * Computes performance KPI summary from a list of tracked bets
 */
export function calculatePerformanceSummary(
  bets: TrackedBetRecommendation[]
): TrackerPerformanceSummary {
  const settled = bets.filter((b) => b.status !== 'PENDING');
  const wins = settled.filter((b) => b.status === 'WON').length;
  const losses = settled.filter((b) => b.status === 'LOST').length;
  const pushes = settled.filter((b) => b.status === 'PUSH').length;

  const totalUnitsStaked = bets.reduce((acc, b) => acc + b.unitsStaked, 0);
  const netUnitsWon = settled.reduce((acc, b) => acc + b.unitsWonLost, 0);

  const decidedCount = wins + losses;
  const winRate = decidedCount > 0 ? (wins / decidedCount) * 100 : 0;
  const settledStaked = settled.reduce((acc, b) => acc + b.unitsStaked, 0);
  const roi = settledStaked > 0 ? (netUnitsWon / settledStaked) * 100 : 0;

  // Streak calculation (from most recent settled bet backward)
  let currentStreak = '0 (Day 1 Started)';
  let bestStreakNum = 0;
  let tempStreakNum = 0;

  for (const b of settled) {
    if (b.status === 'WON') {
      tempStreakNum++;
      if (tempStreakNum > bestStreakNum) bestStreakNum = tempStreakNum;
    } else if (b.status === 'LOST') {
      tempStreakNum = 0;
    }
  }

  if (settled.length > 0) {
    const last = settled[0];
    let streakCount = 0;
    for (const b of settled) {
      if (b.status === last.status) streakCount++;
      else break;
    }
    currentStreak = last.status === 'WON' ? `W${streakCount} 🔥` : last.status === 'LOST' ? `L${streakCount}` : 'PUSH';
  } else {
    currentStreak = '0 (Day 1 Started)';
  }

  // Tier breakdowns
  const tiers: TrackedBetTier[] = [
    'SINGLE_GAME',
    'PARLAY_3LEG',
    'TEASER_3TEAM_10',
    'TEASER_4TEAM_13',
    'PRIME_1GAME',
  ];

  const tierLabels: Record<TrackedBetTier, string> = {
    SINGLE_GAME: '1 Single Game Straight Bet',
    PARLAY_3LEG: '1 3-Leg Value Parlay',
    TEASER_3TEAM_10: '1 3-Team +10 Teaser (7-Day Window)',
    TEASER_4TEAM_13: '1 4-Team +13 Teaser (7-Day Window)',
    PRIME_1GAME: 'Prime 1-Game Strategy',
  };

  const tierBreakdown = tiers.map((tier) => {
    const tierBets = bets.filter((b) => b.tier === tier);
    const tierSettled = tierBets.filter((b) => b.status !== 'PENDING');
    const tWins = tierSettled.filter((b) => b.status === 'WON').length;
    const tLosses = tierSettled.filter((b) => b.status === 'LOST').length;
    const tPushes = tierSettled.filter((b) => b.status === 'PUSH').length;
    const tPending = tierBets.filter((b) => b.status === 'PENDING').length;
    const tNet = tierSettled.reduce((acc, b) => acc + b.unitsWonLost, 0);
    const tDecided = tWins + tLosses;
    const tWinRate = tDecided > 0 ? (tWins / tDecided) * 100 : 0;

    return {
      tier,
      label: tierLabels[tier],
      total: tierBets.length,
      wins: tWins,
      losses: tLosses,
      pushes: tPushes,
      pending: tPending,
      netUnits: parseFloat(tNet.toFixed(2)),
      winRate: parseFloat(tWinRate.toFixed(1)),
    };
  });

  return {
    totalRecommendations: bets.length,
    settledCount: settled.length,
    pendingCount: bets.length - settled.length,
    wins,
    losses,
    pushes,
    winRate: parseFloat(winRate.toFixed(1)),
    totalUnitsStaked: parseFloat(totalUnitsStaked.toFixed(2)),
    netUnitsWon: parseFloat(netUnitsWon.toFixed(2)),
    roi: parseFloat(roi.toFixed(1)),
    currentStreak,
    bestStreak: `W${bestStreakNum}`,
    tierBreakdown,
  };
}

/**
 * Evaluates pattern signals and dynamically computes strategy weights
 * This embodies the learning feedback loop:
 * Patterns with high win rate and positive ROI get boosted.
 * Underperforming patterns get penalized.
 */
export function calculateLearnedPatternSignals(
  bets: TrackedBetRecommendation[]
): PatternSignalMetric[] {
  const settled = bets.filter((b) => b.status !== 'PENDING');
  const allSignalKeys = Object.keys(PATTERN_SIGNAL_METADATA) as PatternSignalType[];

  return allSignalKeys.map((sig) => {
    const meta = PATTERN_SIGNAL_METADATA[sig];
    const matchingBets = settled.filter((b) => b.signalsTagged.includes(sig));

    const totalBets = matchingBets.length;
    const wins = matchingBets.filter((b) => b.status === 'WON').length;
    const losses = matchingBets.filter((b) => b.status === 'LOST').length;
    const pushes = matchingBets.filter((b) => b.status === 'PUSH').length;
    const netUnits = matchingBets.reduce((acc, b) => acc + b.unitsWonLost, 0);

    const decided = wins + losses;
    const winRate = decided > 0 ? (wins / decided) * 100 : 0;
    const staked = matchingBets.reduce((acc, b) => acc + b.unitsStaked, 0);
    const roi = staked > 0 ? (netUnits / staked) * 100 : 0;

    // Adaptive Weight Calculation Formula:
    // Base 1.00
    // If winRate > 75% -> Boost to 1.25x - 1.40x
    // If winRate 55-75% -> Boost to 1.10x - 1.20x
    // If winRate 45-55% -> Neutral 0.95x - 1.05x
    // If winRate < 45% -> Penalize to 0.60x - 0.75x
    let learnedWeight = 1.0;
    let weightStatus: 'BOOSTED' | 'MODERATE_BOOST' | 'NEUTRAL' | 'PENALIZED' = 'NEUTRAL';
    let strategyImpactNote = '';

    if (totalBets === 0) {
      learnedWeight = 1.0;
      strategyImpactNote = "Day 1 Baseline (1.00x): Awaiting first settled game outcome from today's active slate to begin statistical adaptation.";
    } else if (winRate >= 75 && netUnits > 0) {
      learnedWeight = parseFloat((1.0 + Math.min(0.35, (winRate - 50) / 100 * 0.8)).toFixed(2));
      weightStatus = 'BOOSTED';
      strategyImpactNote = `🔥 High-Predictive Signal: ${wins}-${losses} record (${winRate.toFixed(1)}%). Weight amplified to ${learnedWeight}x in selection model.`;
    } else if (winRate >= 58 && netUnits > 0) {
      learnedWeight = parseFloat((1.0 + (winRate - 50) / 100 * 0.4).toFixed(2));
      weightStatus = 'MODERATE_BOOST';
      strategyImpactNote = `✅ Profitable Pattern: ${winRate.toFixed(1)}% win rate generates +${netUnits.toFixed(1)}u. Boosted to ${learnedWeight}x.`;
    } else if (winRate < 45 || netUnits < -1.5) {
      learnedWeight = parseFloat(Math.max(0.6, 1.0 - (50 - winRate) / 100 * 0.7).toFixed(2));
      weightStatus = 'PENALIZED';
      strategyImpactNote = `⚠️ Underperforming Pattern: Only ${winRate.toFixed(1)}% hit rate (-${Math.abs(netUnits).toFixed(1)}u). Weight reduced to ${learnedWeight}x; model actively screens against this.`;
    } else {
      learnedWeight = 1.0;
      weightStatus = 'NEUTRAL';
      strategyImpactNote = `⚖️ Market-Neutral: Performance aligns with baseline break-even expectation. Standard 1.00x weighting maintained.`;
    }

    return {
      signal: sig,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      totalBets,
      wins,
      losses,
      pushes,
      winRate: parseFloat(winRate.toFixed(1)),
      netUnits: parseFloat(netUnits.toFixed(2)),
      roi: parseFloat(roi.toFixed(1)),
      baselineWeight: 1.0,
      learnedWeight,
      weightStatus,
      strategyImpactNote,
    };
  });
}
