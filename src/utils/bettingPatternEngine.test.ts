import { describe, it, expect } from 'vitest';
import { calculatePerformanceSummary } from './bettingPatternEngine';
import { TrackedBetRecommendation, TrackedBetTier } from '../types/sportsBettingTracker';

describe('calculatePerformanceSummary', () => {
  it('should return baseline zeros for an empty array', () => {
    const result = calculatePerformanceSummary([]);

    expect(result).toMatchObject({
      totalRecommendations: 0,
      settledCount: 0,
      pendingCount: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      winRate: 0,
      totalUnitsStaked: 0,
      netUnitsWon: 0,
      roi: 0,
      currentStreak: '0 (Day 1 Started)',
      bestStreak: 'W0',
    });
  });

  it('should correctly handle only pending bets', () => {
    const pendingBets: TrackedBetRecommendation[] = [
      {
        id: '1',
        date: '2026-10-12',
        dateLabel: 'Oct 12, 2026',
        slateTitle: 'Week 6 Monday Night Slate',
        tier: 'SINGLE_GAME',
        title: 'Bet 1',
        subtitle: 'Sub 1',
        badge: 'Badge',
        targetMatchup: 'Matchup',
        payoutOdds: '+100',
        unitsStaked: 1.0,
        unitsWonLost: 0,
        status: 'PENDING',
        legs: [],
        signalsTagged: [],
        preBetRationale: 'Rationale',
      },
      {
        id: '2',
        date: '2026-10-12',
        dateLabel: 'Oct 12, 2026',
        slateTitle: 'Week 6 Monday Night Slate',
        tier: 'PARLAY_3LEG',
        title: 'Bet 2',
        subtitle: 'Sub 2',
        badge: 'Badge',
        targetMatchup: 'Matchup',
        payoutOdds: '+100',
        unitsStaked: 1.5,
        unitsWonLost: 0,
        status: 'PENDING',
        legs: [],
        signalsTagged: [],
        preBetRationale: 'Rationale',
      },
    ];

    const result = calculatePerformanceSummary(pendingBets);

    expect(result.totalRecommendations).toBe(2);
    expect(result.settledCount).toBe(0);
    expect(result.pendingCount).toBe(2);
    expect(result.wins).toBe(0);
    expect(result.totalUnitsStaked).toBe(2.5);
    expect(result.netUnitsWon).toBe(0);
    expect(result.roi).toBe(0);
    expect(result.winRate).toBe(0);
  });

  it('should calculate stats for a mix of bets', () => {
    const bets: TrackedBetRecommendation[] = [
      {
        id: '1',
        date: '2026-10-12',
        dateLabel: 'Oct 12, 2026',
        slateTitle: 'Week 6 Monday Night Slate',
        tier: 'SINGLE_GAME',
        title: 'Bet 1',
        subtitle: 'Sub 1',
        badge: 'Badge',
        targetMatchup: 'Matchup',
        payoutOdds: '+100',
        unitsStaked: 1.0,
        unitsWonLost: 1.0,
        status: 'WON',
        legs: [],
        signalsTagged: [],
        preBetRationale: 'Rationale',
      },
      {
        id: '2',
        date: '2026-10-12',
        dateLabel: 'Oct 12, 2026',
        slateTitle: 'Week 6 Monday Night Slate',
        tier: 'PARLAY_3LEG',
        title: 'Bet 2',
        subtitle: 'Sub 2',
        badge: 'Badge',
        targetMatchup: 'Matchup',
        payoutOdds: '+100',
        unitsStaked: 1.0,
        unitsWonLost: -1.0,
        status: 'LOST',
        legs: [],
        signalsTagged: [],
        preBetRationale: 'Rationale',
      },
      {
        id: '3',
        date: '2026-10-12',
        dateLabel: 'Oct 12, 2026',
        slateTitle: 'Week 6 Monday Night Slate',
        tier: 'SINGLE_GAME',
        title: 'Bet 3',
        subtitle: 'Sub 3',
        badge: 'Badge',
        targetMatchup: 'Matchup',
        payoutOdds: '+100',
        unitsStaked: 1.0,
        unitsWonLost: 0,
        status: 'PUSH',
        legs: [],
        signalsTagged: [],
        preBetRationale: 'Rationale',
      },
      {
        id: '4',
        date: '2026-10-12',
        dateLabel: 'Oct 12, 2026',
        slateTitle: 'Week 6 Monday Night Slate',
        tier: 'TEASER_3TEAM_10',
        title: 'Bet 4',
        subtitle: 'Sub 4',
        badge: 'Badge',
        targetMatchup: 'Matchup',
        payoutOdds: '+100',
        unitsStaked: 2.0,
        unitsWonLost: 2.0,
        status: 'WON',
        legs: [],
        signalsTagged: [],
        preBetRationale: 'Rationale',
      },
      {
        id: '5',
        date: '2026-10-12',
        dateLabel: 'Oct 12, 2026',
        slateTitle: 'Week 6 Monday Night Slate',
        tier: 'SINGLE_GAME',
        title: 'Bet 5',
        subtitle: 'Sub 5',
        badge: 'Badge',
        targetMatchup: 'Matchup',
        payoutOdds: '+100',
        unitsStaked: 1.0,
        unitsWonLost: 0,
        status: 'PENDING',
        legs: [],
        signalsTagged: [],
        preBetRationale: 'Rationale',
      },
    ];

    const result = calculatePerformanceSummary(bets);

    expect(result.totalRecommendations).toBe(5);
    expect(result.settledCount).toBe(4);
    expect(result.pendingCount).toBe(1);
    expect(result.wins).toBe(2);
    expect(result.losses).toBe(1);
    expect(result.pushes).toBe(1);
    expect(result.winRate).toBe(66.7);
    expect(result.totalUnitsStaked).toBe(6.0);
    expect(result.netUnitsWon).toBe(2.0);
    expect(result.roi).toBe(40.0);
    expect(result.currentStreak).toBe('W1 🔥');
    expect(result.bestStreak).toBe('W1');
  });
});
