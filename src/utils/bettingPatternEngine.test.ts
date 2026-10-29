import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeBettingPatterns,
  calculatePerformanceSummary,
  calculateLearnedPatternSignals,
} from './bettingPatternEngine.js';
import { TrackedBetRecommendation } from '../types/sportsBettingTracker.js';

describe('bettingPatternEngine', () => {
  describe('analyzeBettingPatterns', () => {
    it('handles null input gracefully', () => {
      const result = analyzeBettingPatterns(null);
      assert.equal(result.totalBets, 0);
      assert.equal(result.winRate, 0);
      assert.equal(result.roi, 0);
      assert.deepEqual(result.profitableSports, []);
      assert.deepEqual(result.leakSports, []);
      assert.equal(result.summary.totalRecommendations, 0);
      assert.equal(result.summary.wins, 0);
      assert.equal(result.summary.losses, 0);
      assert.equal(result.signals.length, 10);
    });

    it('handles undefined input gracefully', () => {
      const result = analyzeBettingPatterns(undefined);
      assert.equal(result.totalBets, 0);
      assert.equal(result.winRate, 0);
      assert.equal(result.roi, 0);
      assert.deepEqual(result.profitableSports, []);
      assert.deepEqual(result.leakSports, []);
      assert.equal(result.summary.totalRecommendations, 0);
      assert.equal(result.summary.wins, 0);
      assert.equal(result.summary.losses, 0);
      assert.equal(result.signals.length, 10);
    });

    it('handles empty array [] input gracefully', () => {
      const result = analyzeBettingPatterns([]);
      assert.equal(result.totalBets, 0);
      assert.equal(result.winRate, 0);
      assert.equal(result.roi, 0);
      assert.deepEqual(result.profitableSports, []);
      assert.deepEqual(result.leakSports, []);
      assert.equal(result.summary.totalRecommendations, 0);
      assert.equal(result.summary.wins, 0);
      assert.equal(result.summary.losses, 0);
      assert.equal(result.signals.length, 10);
    });

    it('correctly analyzes non-empty bet recommendations', () => {
      const mockBets: TrackedBetRecommendation[] = [
        {
          id: 'bet-1',
          date: '2026-10-12',
          dateLabel: 'Oct 12, 2026',
          slateTitle: 'Week 6 Slate',
          tier: 'SINGLE_GAME',
          title: 'Bears -3.0',
          subtitle: 'Straight bet',
          badge: 'BEST BET',
          targetMatchup: 'NE @ CHI',
          payoutOdds: '-110',
          unitsStaked: 1.0,
          unitsWonLost: 0.91,
          status: 'WON',
          legs: [],
          signalsTagged: ['HOME_UNDERDOG', 'WHALE_DIVERGENCE_20PLUS'],
          preBetRationale: 'Strong home trend',
        },
        {
          id: 'bet-2',
          date: '2026-10-12',
          dateLabel: 'Oct 12, 2026',
          slateTitle: 'Week 6 Slate',
          tier: 'PARLAY_3LEG',
          title: '3-Leg Parlay',
          subtitle: 'Parlay bet',
          badge: 'PARLAY',
          targetMatchup: 'Multi',
          payoutOdds: '+600',
          unitsStaked: 1.0,
          unitsWonLost: -1.0,
          status: 'LOST',
          legs: [],
          signalsTagged: ['CROSS_SPORT_PARLAY'],
          preBetRationale: 'High upside parlay',
        },
      ];

      const result = analyzeBettingPatterns(mockBets);
      assert.equal(result.totalBets, 2);
      assert.equal(result.summary.settledCount, 2);
      assert.equal(result.summary.wins, 1);
      assert.equal(result.summary.losses, 1);
      assert.equal(result.winRate, 50);
      assert.equal(result.summary.totalUnitsStaked, 2.0);
      assert.equal(result.summary.netUnitsWon, -0.09);
      assert.equal(result.signals.length, 10);
    });
  });

  describe('calculatePerformanceSummary', () => {
    it('handles null and undefined input', () => {
      const nullSummary = calculatePerformanceSummary(null);
      assert.equal(nullSummary.totalRecommendations, 0);
      assert.equal(nullSummary.wins, 0);

      const undefinedSummary = calculatePerformanceSummary(undefined);
      assert.equal(undefinedSummary.totalRecommendations, 0);
      assert.equal(undefinedSummary.wins, 0);
    });
  });

  describe('calculateLearnedPatternSignals', () => {
    it('handles null and undefined input', () => {
      const nullSignals = calculateLearnedPatternSignals(null);
      assert.equal(nullSignals.length, 10);
      assert.equal(nullSignals[0].totalBets, 0);

      const undefinedSignals = calculateLearnedPatternSignals(undefined);
      assert.equal(undefinedSignals.length, 10);
      assert.equal(undefinedSignals[0].totalBets, 0);
    });
  });
});
