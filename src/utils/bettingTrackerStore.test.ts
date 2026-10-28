import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  autoGradeTrackedBetsWithLiveGames,
  recalibrateTrackedBetsWithLiveMarket,
  updateBetStatus,
  resetTrackedBetsToSeed,
  exportTrackedBetsToCSV,
  getTrackedBets,
  saveTrackedBets,
  INITIAL_TRACKED_BETS,
} from './bettingTrackerStore';
import { TrackedBetRecommendation, BetOutcome } from '../types/sportsBettingTracker';
import { GameMarket } from '../types/sportsBetting';

function createMockGame(overrides: Partial<GameMarket> = {}): GameMarket {
  return {
    id: 'game-chi-pat',
    league: 'NFL',
    homeTeam: {
      name: 'Bears',
      city: 'Chicago',
      abbr: 'CHI',
      record: '4-2',
      logoColor: '#0B162A',
    },
    awayTeam: {
      name: 'Patriots',
      city: 'New England',
      abbr: 'NE',
      record: '2-4',
      logoColor: '#002244',
    },
    scheduledTime: '2026-10-22T20:15:00Z',
    stadium: 'Soldier Field',
    status: 'FINAL',
    statusState: 'post',
    scores: {
      home: 24,
      away: 17,
    },
    totalBetsPlaced: 15000,
    totalDollarsWagered: 1200000,
    splits: {
      spread: {
        home: {
          side: 'Chicago Bears -3.0',
          ticketPercentage: 41,
          moneyPercentage: 79,
          totalTicketsCount: 6150,
          totalHandleAmount: 948000,
          sharpSignal: 'HEAVY_SHARP',
        },
        away: {
          side: 'New England Patriots +3.0',
          ticketPercentage: 59,
          moneyPercentage: 21,
          totalTicketsCount: 8850,
          totalHandleAmount: 252000,
          sharpSignal: 'PUBLIC_HEAVY',
        },
      },
      moneyline: {
        home: {
          side: 'Chicago Bears ML',
          ticketPercentage: 50,
          moneyPercentage: 50,
          totalTicketsCount: 1000,
          totalHandleAmount: 100000,
          sharpSignal: 'BALANCED',
        },
        away: {
          side: 'New England Patriots ML',
          ticketPercentage: 50,
          moneyPercentage: 50,
          totalTicketsCount: 1000,
          totalHandleAmount: 100000,
          sharpSignal: 'BALANCED',
        },
      },
      total: {
        over: {
          side: 'Over 43.5',
          ticketPercentage: 50,
          moneyPercentage: 50,
          totalTicketsCount: 1000,
          totalHandleAmount: 100000,
          sharpSignal: 'BALANCED',
        },
        under: {
          side: 'Under 43.5',
          ticketPercentage: 50,
          moneyPercentage: 50,
          totalTicketsCount: 1000,
          totalHandleAmount: 100000,
          sharpSignal: 'BALANCED',
        },
      },
    },
    lineMovements: [],
    sportsbooks: [],
    consensus: {
      spread: 'CHI -3.0',
      total: 43.5,
      moneylineHome: -160,
      moneylineAway: 140,
    },
    ...overrides,
  };
}

function createMockBet(overrides: Partial<TrackedBetRecommendation> = {}): TrackedBetRecommendation {
  return {
    id: 'test-bet-1',
    date: '2026-10-22',
    dateLabel: 'Oct 22, 2026',
    slateTitle: 'Week 7 TNF',
    tier: 'SINGLE_GAME',
    title: 'Chicago Bears -3.0',
    subtitle: 'TNF Single Bet',
    badge: 'PENDING',
    targetMatchup: 'Patriots @ Bears',
    payoutOdds: '-110',
    unitsStaked: 1.0,
    unitsWonLost: 0,
    status: 'PENDING',
    signalsTagged: ['WHALE_DIVERGENCE_20PLUS'],
    preBetRationale: 'Sharp handle on Bears',
    legs: [
      {
        id: 'leg-1',
        gameId: 'game-chi-pat',
        gameMatchup: 'New England Patriots @ Chicago Bears',
        league: 'NFL',
        gameDate: 'Thursday, Oct 22',
        betType: 'SPREAD',
        targetSelection: 'Chicago Bears -3.0 Point Spread',
        originalLine: 'Bears -3.0 (-110)',
        bestOdds: '-110',
        bestSportsbook: 'Circa Sports',
        status: 'PENDING',
        rationale: 'Bears home field edge',
      },
    ],
    ...overrides,
  };
}

describe('bettingTrackerStore - Integration & Unit Tests', () => {
  describe('autoGradeTrackedBetsWithLiveGames', () => {
    test('returns original bets if liveGames is empty or null', () => {
      const bets = [createMockBet()];
      assert.deepStrictEqual(autoGradeTrackedBetsWithLiveGames(bets, []), bets);
      assert.deepStrictEqual(autoGradeTrackedBetsWithLiveGames(bets, null as any), bets);
    });

    test('ignores bets that are already fully settled', () => {
      const settledBet = createMockBet({ status: 'WON', unitsWonLost: 0.91 });
      const liveGame = createMockGame();
      const result = autoGradeTrackedBetsWithLiveGames([settledBet], [liveGame]);
      assert.strictEqual(result[0].status, 'WON');
      assert.strictEqual(result[0].unitsWonLost, 0.91);
    });

    test('grades SPREAD bet: Home team winning and covering spread', () => {
      // CHI 24, NE 17 -> Margin +7 for CHI. CHI -3.0 spread covered (+7 - 3 = +4 > 0)
      const bet = createMockBet();
      const liveGame = createMockGame({ scores: { home: 24, away: 17 } });
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'WON');
      assert.strictEqual(result[0].legs[0].status, 'WON');
      assert.strictEqual(result[0].unitsWonLost, 0.91); // -110 odds -> 1.0 * (100/110) = 0.91
      assert.ok(result[0].settledAt);
      assert.ok(result[0].legs[0].finalScore?.includes('NE 17, CHI 24'));
    });

    test('grades SPREAD bet: Home team winning but failing to cover spread', () => {
      // CHI 20, NE 19 -> Margin +1 for CHI. CHI -3.0 spread failed (+1 - 3 = -2 < 0)
      const bet = createMockBet();
      const liveGame = createMockGame({ scores: { home: 20, away: 19 } });
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'LOST');
      assert.strictEqual(result[0].legs[0].status, 'LOST');
      assert.strictEqual(result[0].unitsWonLost, -1.0);
    });

    test('grades SPREAD bet: Home team winning and pushing spread exactly', () => {
      // CHI 20, NE 17 -> Margin +3 for CHI. CHI -3.0 spread pushes (+3 - 3 = 0)
      const bet = createMockBet();
      const liveGame = createMockGame({ scores: { home: 20, away: 17 } });
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'WON'); // all legs are WON or PUSH -> allWon evaluated true
      assert.strictEqual(result[0].legs[0].status, 'PUSH');
    });

    test('grades SPREAD bet: Away team underdog selection winning', () => {
      // Away team selection Patriots +3.0. Final score CHI 24, NE 23 (Margin -1 for NE, +3 line = +2 > 0 -> WON)
      const bet = createMockBet({
        legs: [
          {
            id: 'leg-away-spread',
            gameId: 'game-chi-pat',
            gameMatchup: 'New England Patriots @ Chicago Bears',
            league: 'NFL',
            gameDate: 'Thursday, Oct 22',
            betType: 'SPREAD',
            targetSelection: 'New England Patriots +3.0',
            originalLine: 'Patriots +3.0 (-110)',
            bestOdds: '-110',
            bestSportsbook: 'DraftKings',
            status: 'PENDING',
            rationale: 'Patriots road dog',
          },
        ],
      });
      const liveGame = createMockGame({ scores: { home: 24, away: 23 } });
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'WON');
      assert.strictEqual(result[0].legs[0].status, 'WON');
    });

    test('grades TOTAL bet: Under covering', () => {
      const bet = createMockBet({
        legs: [
          {
            id: 'leg-total-under',
            gameId: 'game-chi-pat',
            gameMatchup: 'New England Patriots @ Chicago Bears',
            league: 'NFL',
            gameDate: 'Thursday, Oct 22',
            betType: 'TOTAL',
            targetSelection: 'Under 43.5 Game Total',
            originalLine: 'Under 43.5 (-110)',
            bestOdds: '-110',
            bestSportsbook: 'DraftKings',
            status: 'PENDING',
            rationale: 'Defensive battle',
          },
        ],
      });
      // Final total score 24 + 17 = 41 < 43.5 -> WON
      const liveGame = createMockGame({ scores: { home: 24, away: 17 } });
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'WON');
      assert.strictEqual(result[0].legs[0].status, 'WON');
    });

    test('grades TOTAL bet: Over failing when total points are less', () => {
      const bet = createMockBet({
        legs: [
          {
            id: 'leg-total-over',
            gameId: 'game-chi-pat',
            gameMatchup: 'New England Patriots @ Chicago Bears',
            league: 'NFL',
            gameDate: 'Thursday, Oct 22',
            betType: 'TOTAL',
            targetSelection: 'Over 43.5 Game Total',
            originalLine: 'Over 43.5 (-110)',
            bestOdds: '-110',
            bestSportsbook: 'DraftKings',
            status: 'PENDING',
            rationale: 'Shootout expected',
          },
        ],
      });
      // Final total score 24 + 17 = 41 < 43.5 -> Over LOST
      const liveGame = createMockGame({ scores: { home: 24, away: 17 } });
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'LOST');
      assert.strictEqual(result[0].legs[0].status, 'LOST');
    });

    test('grades MONEYLINE bet: Home team winning', () => {
      const bet = createMockBet({
        legs: [
          {
            id: 'leg-ml',
            gameId: 'game-chi-pat',
            gameMatchup: 'New England Patriots @ Chicago Bears',
            league: 'NFL',
            gameDate: 'Thursday, Oct 22',
            betType: 'MONEYLINE',
            targetSelection: 'Chicago Bears Moneyline',
            originalLine: 'Bears ML (-160)',
            bestOdds: '-160',
            bestSportsbook: 'Circa',
            status: 'PENDING',
            rationale: 'Bears home win',
          },
        ],
      });
      const liveGame = createMockGame({ scores: { home: 24, away: 17 } });
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'WON');
      assert.strictEqual(result[0].legs[0].status, 'WON');
    });

    test('grades MONEYLINE bet: Away team winning when Home was picked', () => {
      const bet = createMockBet({
        legs: [
          {
            id: 'leg-ml',
            gameId: 'game-chi-pat',
            gameMatchup: 'New England Patriots @ Chicago Bears',
            league: 'NFL',
            gameDate: 'Thursday, Oct 22',
            betType: 'MONEYLINE',
            targetSelection: 'Chicago Bears Moneyline',
            originalLine: 'Bears ML (-160)',
            bestOdds: '-160',
            bestSportsbook: 'Circa',
            status: 'PENDING',
            rationale: 'Bears home win',
          },
        ],
      });
      // Away 21, Home 14 -> Away won -> Home ML LOST
      const liveGame = createMockGame({ scores: { home: 14, away: 21 } });
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'LOST');
      assert.strictEqual(result[0].legs[0].status, 'LOST');
    });

    test('handles multi-leg parlay with partial legs completed and pending', () => {
      const game1 = createMockGame({
        id: 'game-1',
        scores: { home: 24, away: 17 }, // CHI -3.0 covered
      });
      const game2 = createMockGame({
        id: 'game-2',
        homeTeam: { name: '49ers', city: 'San Francisco', abbr: 'SF', record: '5-1', logoColor: '#AA0000' },
        awayTeam: { name: 'Falcons', city: 'Atlanta', abbr: 'ATL', record: '3-3', logoColor: '#A71930' },
        status: 'UPCOMING',
        statusState: 'pre',
        scores: { home: 0, away: 0 },
      });

      const parlay = createMockBet({
        id: 'parlay-1',
        tier: 'PARLAY_3LEG',
        payoutOdds: '+480',
        unitsStaked: 0.75,
        legs: [
          {
            id: 'p-leg-1',
            gameId: 'game-1',
            gameMatchup: 'Patriots @ Bears',
            league: 'NFL',
            gameDate: 'Oct 22',
            betType: 'SPREAD',
            targetSelection: 'Chicago Bears -3.0',
            originalLine: 'Bears -3.0',
            bestOdds: '-110',
            bestSportsbook: 'Circa',
            status: 'PENDING',
            rationale: 'Leg 1',
          },
          {
            id: 'p-leg-2',
            gameId: 'game-2',
            gameMatchup: '49ers @ Falcons',
            league: 'NFL',
            gameDate: 'Oct 25',
            betType: 'SPREAD',
            targetSelection: '49ers -3.0',
            originalLine: '49ers -3.0',
            bestOdds: '-110',
            bestSportsbook: 'Circa',
            status: 'PENDING',
            rationale: 'Leg 2',
          },
        ],
      });

      const result = autoGradeTrackedBetsWithLiveGames([parlay], [game1, game2]);

      assert.strictEqual(result[0].status, 'PENDING');
      assert.strictEqual(result[0].legs[0].status, 'WON');
      assert.strictEqual(result[0].legs[1].status, 'PENDING');
      assert.ok(result[0].badge.includes('1/2 CASHED'));
      assert.ok(result[0].subtitle.includes('IN PROGRESS: 1 of 2 Legs Cashed cleanly'));
    });

    test('calculates correct positive odds payout units when all legs won', () => {
      const liveGame = createMockGame({ scores: { home: 24, away: 17 } });
      const bet = createMockBet({
        payoutOdds: '+480',
        unitsStaked: 1.0,
      });

      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'WON');
      assert.strictEqual(result[0].unitsWonLost, 4.8); // 1.0 * (480 / 100) = 4.8
    });

    test('matches games by team abbreviations when gameId is missing', () => {
      const bet = createMockBet({
        legs: [
          {
            id: 'leg-no-gameid',
            gameMatchup: 'New England Patriots @ Chicago Bears',
            league: 'NFL',
            gameDate: 'Oct 22',
            betType: 'SPREAD',
            targetSelection: 'Chicago Bears -3.0',
            originalLine: 'Bears -3.0',
            bestOdds: '-110',
            bestSportsbook: 'Circa',
            status: 'PENDING',
            rationale: 'No game ID matching test',
          },
        ],
      });
      const liveGame = createMockGame({ id: 'some-other-id' }); // CHI and NE abbr present
      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'WON');
      assert.strictEqual(result[0].legs[0].status, 'WON');
    });

    test('leaves bet PENDING if game is not finished', () => {
      const bet = createMockBet();
      const liveGame = createMockGame({
        status: 'LIVE',
        statusState: 'in',
        scores: { home: 14, away: 10 },
      });

      const result = autoGradeTrackedBetsWithLiveGames([bet], [liveGame]);

      assert.strictEqual(result[0].status, 'PENDING');
      assert.strictEqual(result[0].legs[0].status, 'PENDING');
    });
  });

  describe('recalibrateTrackedBetsWithLiveMarket', () => {
    test('returns original bets if liveGames is empty or null', () => {
      const bets = [createMockBet()];
      assert.deepStrictEqual(recalibrateTrackedBetsWithLiveMarket(bets, []), bets);
      assert.deepStrictEqual(recalibrateTrackedBetsWithLiveMarket(bets, null as any), bets);
    });

    test('recalibrates PENDING bet leg line and tags sharp handle divergence note', () => {
      const bet = createMockBet();
      const liveGame = createMockGame({
        consensus: {
          spread: 'CHI -3.5',
          total: 44.0,
          moneylineHome: -170,
          moneylineAway: 150,
        },
        splits: {
          spread: {
            home: { side: 'CHI -3.5', ticketPercentage: 30, moneyPercentage: 80, totalTicketsCount: 100, totalHandleAmount: 1000, sharpSignal: 'HEAVY_SHARP' },
            away: { side: 'NE +3.5', ticketPercentage: 70, moneyPercentage: 20, totalTicketsCount: 200, totalHandleAmount: 200, sharpSignal: 'PUBLIC_HEAVY' },
          },
          moneyline: { home: {} as any, away: {} as any },
          total: { over: {} as any, under: {} as any },
        },
      });

      const result = recalibrateTrackedBetsWithLiveMarket([bet], [liveGame]);

      assert.ok(result[0].lastLiveRecalibratedAt);
      assert.ok(result[0].liveRecalibrationNotice?.includes('LIVE MARKET RECALIBRATED'));
      assert.strictEqual(result[0].legs[0].currentLiveLine, 'Live Market Line: CHI -3.5');
      assert.ok(result[0].legs[0].rationale.includes('Live Recalibrated: Market holding at Live Market Line: CHI -3.5'));
    });

    test('ignores non-PENDING bets during recalibration', () => {
      const bet = createMockBet({ status: 'WON' });
      const liveGame = createMockGame();

      const result = recalibrateTrackedBetsWithLiveMarket([bet], [liveGame]);

      assert.strictEqual(result[0], bet);
      assert.strictEqual(result[0].lastLiveRecalibratedAt, undefined);
    });
  });

  describe('updateBetStatus', () => {
    test('manually updates bet status to WON with positive payout odds', () => {
      // In Node environment without window, updateBetStatus operates on getTrackedBets() fallback (INITIAL_TRACKED_BETS)
      const initialBets = getTrackedBets();
      const targetId = initialBets[0].id; // 'rec-20261012-single' or active bet

      const updated = updateBetStatus(targetId, 'WON', 'FINAL SCORE 30-20', 'Manual win note');
      const updatedBet = updated.find((b) => b.id === targetId);

      assert.ok(updatedBet);
      assert.strictEqual(updatedBet?.status, 'WON');
      assert.strictEqual(updatedBet?.postGameAnalysis, 'Manual win note');
      assert.strictEqual(updatedBet?.legs[0].status, 'WON');
      assert.strictEqual(updatedBet?.legs[0].finalScore, 'FINAL SCORE 30-20');
    });

    test('manually updates bet status to LOST and computes negative units', () => {
      const initialBets = getTrackedBets();
      const targetId = initialBets[0].id;

      const updated = updateBetStatus(targetId, 'LOST', 'FINAL SCORE 10-20', 'Manual loss note');
      const updatedBet = updated.find((b) => b.id === targetId);

      assert.ok(updatedBet);
      assert.strictEqual(updatedBet?.status, 'LOST');
      assert.strictEqual(updatedBet?.unitsWonLost, -updatedBet!.unitsStaked);
    });

    test('manually updates bet status to PUSH and sets units to 0', () => {
      const initialBets = getTrackedBets();
      const targetId = initialBets[0].id;

      const updated = updateBetStatus(targetId, 'PUSH');
      const updatedBet = updated.find((b) => b.id === targetId);

      assert.ok(updatedBet);
      assert.strictEqual(updatedBet?.status, 'PUSH');
      assert.strictEqual(updatedBet?.unitsWonLost, 0);
    });
  });

  describe('exportTrackedBetsToCSV', () => {
    test('exports bets array into formatted CSV string', () => {
      const bets = [createMockBet()];
      const csv = exportTrackedBetsToCSV(bets);

      assert.ok(csv.startsWith('ID,Date,Matchup,Tier,Title,Selection,Odds,Staked,Outcome,NetUnits'));
      assert.ok(csv.includes('test-bet-1'));
      assert.ok(csv.includes('Patriots @ Bears'));
      assert.ok(csv.includes('Chicago Bears -3.0 Point Spread'));
    });
  });

  describe('getTrackedBets & resetTrackedBetsToSeed', () => {
    test('resetTrackedBetsToSeed returns INITIAL_TRACKED_BETS', () => {
      const seed = resetTrackedBetsToSeed();
      assert.strictEqual(seed, INITIAL_TRACKED_BETS);
      assert.ok(Array.isArray(seed));
      assert.ok(seed.length > 0);
    });
  });
});
