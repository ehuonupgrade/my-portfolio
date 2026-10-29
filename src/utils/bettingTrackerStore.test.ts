import test from 'node:test';
import assert from 'node:assert';
import { getTrackedBets, INITIAL_TRACKED_BETS } from './bettingTrackerStore.js';

test('getTrackedBets returns initial tracked bets when window is undefined', () => {
  const bets = getTrackedBets();
  assert.ok(Array.isArray(bets));
  assert.strictEqual(bets.length, INITIAL_TRACKED_BETS.length);
  assert.strictEqual(bets[0].id, INITIAL_TRACKED_BETS[0].id);
});
